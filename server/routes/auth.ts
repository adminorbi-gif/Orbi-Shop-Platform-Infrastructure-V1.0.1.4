import { Router } from 'express';
import crypto from 'crypto';
import { supabase, getSupabase, getAdminSupabase, encrypt } from '../lib/supabase.js';
import { callOrbiPayGateway } from '../lib/orbiPayGateway.js';

const router = Router();

function normalizeSettlementMethod(value: unknown) {
  const method = String(value || '').trim().toLowerCase();
  if (method === 'orbi') return 'orbi';
  if (method === 'card') return 'card';
  if (method === 'mobile') return 'mobile_money';
  return 'bank_account';
}

function maskSettlementAccount(value: unknown) {
  const raw = String(value || '').trim();
  if (!raw) return null;
  const compact = raw.replace(/\s+/g, '');
  if (compact.length <= 6) return `${compact.slice(0, 2)}***`;
  return `${compact.slice(0, 3)}***${compact.slice(-3)}`;
}

async function createSellerPaymentProfile(input: {
  userId: string;
  email: string;
  phone?: string;
  sellerName: string;
  accountIdentifier: string;
  role: string;
  settlementField: 'bankAccount' | 'companyBankAccount';
}) {
  const idempotencyKey = `orbishop:seller-payment-profile:${input.userId}:${input.settlementField}`;
  const result = await callOrbiPayGateway('/v1/payment-profiles', {
    method: 'POST',
    idempotencyKey,
    body: {
      idempotencyKey,
      userId: input.userId,
      email: input.email,
      phone: input.phone,
      externalCustomerId: `orbishop:seller:${input.userId}`,
      scopes: [
        'payment_profile:read',
        'balance:read',
        'payments:create',
        'escrow:create',
        'withdrawal:request',
      ],
      consent: {
        accepted: true,
        source: 'orbi-shop-seller-registration',
        accountIdentifier: input.accountIdentifier,
        acceptedAt: new Date().toISOString(),
      },
      metadata: {
        source: 'orbi-shop',
        profileType: 'seller_settlement',
        sellerName: input.sellerName,
        sellerRole: input.role,
        settlementField: input.settlementField,
      },
    },
  });

  const profile = result?.data || result?.paymentProfile || result?.profile || result;
  const profileId = String(profile?.profileId || profile?.paymentProfileId || profile?.id || '').trim();
  if (!profileId) {
    const error = new Error('ORBI_PAYMENT_PROFILE_NOT_CREATED');
    (error as any).status = 502;
    (error as any).details = result;
    throw error;
  }

  return {
    profileId,
    status: String(profile?.status || 'active'),
    scopes: Array.isArray(profile?.scopes) ? profile.scopes : [],
  };
}

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ success: false, error: 'Email and password required' });
  }

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return res.status(401).json({ success: false, error: error.message });
    }

    if (data?.user) {
      const userId = data.user.id;
      
      // Check customer database row
      const { data: customer, error: dbErr } = await getAdminSupabase()
        .from('customers')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (dbErr) {
        console.error('[AUTH LOGIN DB QUERY ERROR]', dbErr.message || dbErr);
      }

      if (customer) {
        if (customer.status === 'frozen' || customer.status === 'blocked') {
          // Strictly reject active session if blocked/frozen
          await supabase.auth.signOut();
          let parsedReason = customer.block_reason || '';
          if (parsedReason && parsedReason.startsWith('[')) {
            try {
              const logs = JSON.parse(parsedReason);
              if (Array.isArray(logs) && logs.length > 0) {
                parsedReason = logs[logs.length - 1].reason || '';
              }
            } catch (e) {}
          }
          const reasonMsg = parsedReason ? ` Sababu (Reason): ${parsedReason}.` : '';
          return res.status(403).json({
            success: false,
            error: `Akaunti yako imezuiwa au kufungwa.${reasonMsg} Tafadhali wasiliana na usaidizi kupitia namba +255 764 258 114.`
          });
        }
      }

      // Check seller database row just in case they are frozen as a seller
      const { data: seller, error: sellerErr } = await getAdminSupabase()
        .from('sellers')
        .select('*')
        .eq('id', userId)
        .maybeSingle();
      
      if (seller) {
        if (seller.status === 'frozen' || seller.status === 'blocked') {
          // Strictly reject active session if blocked/frozen
          await supabase.auth.signOut();
          let parsedReason = seller.block_reason || '';
          if (parsedReason && parsedReason.startsWith('[')) {
            try {
              const logs = JSON.parse(parsedReason);
              if (Array.isArray(logs) && logs.length > 0) {
                parsedReason = logs[logs.length - 1].reason || '';
              }
            } catch (e) {}
          }
          const reasonMsg = parsedReason ? ` Sababu (Reason): ${parsedReason}.` : '';
          return res.status(403).json({
            success: false,
            error: `Akaunti yako imezuiwa au kufungwa.${reasonMsg} Tafadhali wasiliana na usaidizi kupitia namba +255 764 258 114.`
          });
        }
      }

      if (!customer) {
        // Automatically sync/provision database customer profile if it doesn't exist
        const encryptedPassword = encrypt(password, true);
        const customerPayload = {
          id: userId,
          name: data.user.user_metadata?.full_name || email.split('@')[0],
          phone: data.user.user_metadata?.phone || '',
          email: email.toLowerCase().trim(),
          password: encryptedPassword,
          registered_at: new Date().toISOString(),
          status: 'active',
          security_flags: 0,
          preferred_language: 'sw',
          tin: ''
        };

        const { error: insertErr } = await getAdminSupabase()
          .from('customers')
          .insert([customerPayload]);

        if (insertErr) {
          console.error('[AUTH LOGIN SYNC DB ERROR] Failed to provision customer profile:', insertErr.message || insertErr);
        }
      }
    }

    res.json({
      success: true,
      data,
      session: data.session,
      user: data.user
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/signup', async (req, res) => {
  const {
    email,
    password,
    full_name,
    phone,
    nationalId,
    dob,
    role,
    preferredLanguage,
    
    // Producer attributes
    farmName,
    productionCategory,
    capacity,
    capacityUnit,
    primaryProducts,
    location,
    gpsLat,
    gpsLng,
    harvestSchedule,
    certifications,
    bankAccount,
    bankAccountMethod,

    // Industrial attributes
    legalName,
    tradingName,
    industrySector,
    registrationNo,
    tinNumber,
    vrnNumber,
    physicalAddress,
    billingAddress,
    procurementContact,
    procurementPhone,
    paymentTerms,
    companyBankAccount,
    companyBankAccountMethod,

    // Wakala attributes
    agencyName,
    specialties,
    operatingZones,
    commissionRate,
    languages,
    yearsExperience,
    profileBio,
    references
  } = req.body;
  
  if (!email || !password) {
    return res.status(400).json({ success: false, error: 'Email and password required' });
  }

  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: full_name || farmName || legalName || agencyName,
          phone,
          role: role || 'CONSUMER',
          nationalId,
          dob
        }
      }
    });

    if (error) {
      return res.status(400).json({ success: false, error: error.message });
    }

    const userId = data.user?.id;
    if (userId) {
      // Securely store credentials in db
      const encryptedPassword = encrypt(password, true);
      const customerPayload = {
        id: userId,
        name: full_name || farmName || legalName || agencyName || email.split('@')[0],
        phone: phone || '',
        email: email.toLowerCase().trim(),
        password: encryptedPassword,
        registered_at: new Date().toISOString(),
        status: 'active',
        security_flags: 0,
        preferred_language: preferredLanguage || 'sw',
        tin: tinNumber || ''
      };

      const { error: dbError } = await getAdminSupabase()
        .from('customers')
        .insert([customerPayload]);

      if (dbError) {
        console.error('[AUTH SIGNUP DB ERROR] Failed to save customer profile to DB:', dbError.message || dbError);
      }

      // Create Role-Specific Profiles in parallel or sequentially
      if (role === 'PRODUCER') {
        const settlementMethod = normalizeSettlementMethod(bankAccountMethod);
        const paymentProfile = settlementMethod === 'orbi'
          ? await createSellerPaymentProfile({
              userId,
              email: email.toLowerCase().trim(),
              phone,
              sellerName: farmName || full_name || email.split('@')[0],
              accountIdentifier: bankAccount,
              role: 'PRODUCER',
              settlementField: 'bankAccount',
            })
          : null;
        const sellerPayload = {
          id: userId,
          name: farmName || full_name,
          description: `Producer: ${productionCategory || 'General'}. Capacity: ${capacity || 0} ${capacityUnit || 'KG/Month'}. Primary Products: ${Array.isArray(primaryProducts) ? primaryProducts.join(', ') : (primaryProducts || '')}. Harvest Schedule: ${harvestSchedule || 'N/A'}. Certifications: ${Array.isArray(certifications) ? certifications.join(', ') : (certifications || '')}. Settlement: ${settlementMethod}. Account: ${maskSettlementAccount(bankAccount) || 'N/A'}`,
          email: email.toLowerCase().trim(),
          status: 'active',
          pickup_address: location || '',
          pickup_lat: gpsLat ? Number(gpsLat) : null,
          pickup_lng: gpsLng ? Number(gpsLng) : null,
          is_pro: false,
          payment_profile_id: paymentProfile?.profileId || null,
          payment_profile_status: paymentProfile?.status || null,
          payment_profile_scopes: paymentProfile?.scopes || [],
          settlement_method: settlementMethod,
          settlement_account_hint: maskSettlementAccount(bankAccount),
          settlement_verified_at: paymentProfile ? new Date().toISOString() : null,
          created_at: new Date().toISOString()
        };

        const { error: selError } = await getAdminSupabase()
          .from('sellers')
          .insert([sellerPayload]);

        if (selError) {
          console.error('[AUTH PRODUCER REGISTRATION ERROR]', selError.message || selError);
          throw selError;
        }
      } else if (role === 'INDUSTRIAL') {
        const settlementMethod = normalizeSettlementMethod(companyBankAccountMethod);
        const paymentProfile = settlementMethod === 'orbi'
          ? await createSellerPaymentProfile({
              userId,
              email: email.toLowerCase().trim(),
              phone,
              sellerName: legalName || tradingName || full_name || email.split('@')[0],
              accountIdentifier: companyBankAccount,
              role: 'INDUSTRIAL',
              settlementField: 'companyBankAccount',
            })
          : null;
        const sellerPayload = {
          id: userId,
          name: legalName || tradingName || full_name,
          description: `Industrial B2B. Sector: ${industrySector || 'Other'}. BRELA: ${registrationNo || 'N/A'}. VRN: ${vrnNumber || 'N/A'}. Procurement Contact: ${procurementContact || 'N/A'}. Terms: ${paymentTerms || 'Cash'}. Settlement: ${settlementMethod}. Account: ${maskSettlementAccount(companyBankAccount) || 'N/A'}`,
          email: email.toLowerCase().trim(),
          status: 'active',
          tin: tinNumber || '',
          pickup_address: physicalAddress || billingAddress || '',
          is_pro: true,
          payment_profile_id: paymentProfile?.profileId || null,
          payment_profile_status: paymentProfile?.status || null,
          payment_profile_scopes: paymentProfile?.scopes || [],
          settlement_method: settlementMethod,
          settlement_account_hint: maskSettlementAccount(companyBankAccount),
          settlement_verified_at: paymentProfile ? new Date().toISOString() : null,
          created_at: new Date().toISOString()
        };

        const { error: selError } = await getAdminSupabase()
          .from('sellers')
          .insert([sellerPayload]);

        if (selError) {
          console.error('[AUTH INDUSTRIAL REGISTRATION ERROR]', selError.message || selError);
          throw selError;
        }
      } else if (role === 'WAKALA') {
        const brokerPayload = {
          id: userId,
          name: full_name || agencyName,
          phone: phone || '',
          email: email.toLowerCase().trim(),
          company_name: agencyName || '',
          status: 'pending',
          commission_rate: commissionRate ? Number(commissionRate) : 3.00,
          area_of_operation: Array.isArray(operatingZones) ? operatingZones.join(', ') : (operatingZones || 'Dar es Salaam'),
          created_at: new Date().toISOString()
        };

        const { error: brokError } = await getAdminSupabase()
          .from('brokers')
          .insert([brokerPayload]);

        if (brokError) {
          console.error('[AUTH WAKALA REGISTRATION ERROR]', brokError.message || brokError);
        }
      }
    }

    res.json({
      success: true,
      data,
      session: data.session,
      user: data.user
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/logout', async (req, res) => {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) {
      return res.status(400).json({ success: false, error: error.message });
    }
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/refresh', async (req, res) => {
  const { refresh_token } = req.body || {};

  if (!refresh_token) {
    return res.status(400).json({ success: false, error: 'Refresh token required' });
  }

  try {
    const { data, error } = await supabase.auth.refreshSession({ refresh_token });

    if (error || !data?.session) {
      return res.status(401).json({ success: false, error: error?.message || 'Session refresh failed' });
    }

    res.json({
      success: true,
      data,
      session: data.session,
      user: data.user,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Endpoint to find account and return masked phone number and name
router.post('/initiate', async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ success: false, message: 'Email required' });
  }

  try {
    const { data: customer, error } = await supabase
      .from('customers')
      .select('id, phone, name')
      .eq('email', email)
      .maybeSingle();

    if (error || !customer) {
      // Generic message to prevent enumeration
      return res.json({ success: true, maskedPhone: null });
    }

    const { phone, name } = customer;
    // Mask phone: keep first 5, last 2, mask the middle
    const maskedPhone = phone && phone.length > 7 
      ? phone.substring(0, 5) + '*******' + phone.substring(phone.length - 2)
      : '*******';

    res.json({ success: true, maskedPhone, name, customerId: customer.id });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// DB-backed password reset flow using password_reset_tokens table
// Table schema (see db/migrations): id, customer_id, token_hash, expires_at, used, used_at, created_at

// Endpoint to verify full phone number and send OTP (stored hashed in DB)
router.post('/verify', async (req, res) => {
  const { customerId, phone } = req.body;
  try {
    const { data: customer, error } = await supabase
      .from('customers')
      .select('id, phone, name')
      .eq('id', customerId)
      .eq('phone', phone)
      .maybeSingle();

    if (error || !customer) {
      return res.status(400).json({ success: false, message: 'Incorrect phone number.' });
    }

    // Generate 6-digit OTP code securely
    const otp = crypto.randomInt(100000, 999999).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // 10 minutes

    // Hash the OTP before storing
    const otpHash = crypto.createHash('sha256').update(otp).digest('hex');

    // Store hashed OTP in password_reset_tokens (use admin client to bypass RLS)
    const { error: insertErr } = await getAdminSupabase()
      .from('password_reset_tokens')
      .insert([{ customer_id: customerId, token_hash: otpHash, expires_at: expiresAt }]);

    if (insertErr) {
      console.error('[AUTH] Failed to insert OTP token into DB:', insertErr.message || insertErr);
      return res.status(500).json({ success: false, message: 'Failed to create reset token session.' });
    }

    // Send the OTP via SMS using OrbiTalk direct SMS
    const { sendOrbiTalkDirectSMS } = await import('./talk.js');
    const smsMessage = `Habari ${customer.name || 'mteja'}, namba yako ya uhakiki ya kuweka upya nenosiri ni: ${otp}. Usishiriki na mtu yeyote.`;
    
    await sendOrbiTalkDirectSMS({
      recipient: phone,
      body: smsMessage,
      requestId: `otp-pass-reset-${customerId}-${Date.now()}`
    }).catch(smsErr => console.error('[ORBI-TALK-OTP-RECOVERY] Failed to send SMS:', smsErr?.message || smsErr));

    // Do NOT return the raw OTP. Client should prompt user to enter it from SMS.
    res.json({ success: true, requiresOtp: true });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Endpoint to verify the OTP and issue reset token (long-lived token returned to client)
router.post('/verify-otp', async (req, res) => {
  const { customerId, otp } = req.body;
  try {
    if (!customerId || !otp) return res.status(400).json({ success: false, message: 'customerId and otp required' });

    const otpHash = crypto.createHash('sha256').update(String(otp)).digest('hex');

    // Find matching, unused OTP token for this customer
    const now = new Date().toISOString();
    const { data: rows, error } = await getAdminSupabase()
      .from('password_reset_tokens')
      .select('*')
      .eq('customer_id', customerId)
      .eq('token_hash', otpHash)
      .eq('used', false)
      .gt('expires_at', now)
      .order('created_at', { ascending: false })
      .limit(1);

    if (error) {
      console.error('[AUTH] OTP lookup error:', error.message || error);
      return res.status(500).json({ success: false, message: 'OTP verification failed' });
    }

    if (!rows || rows.length === 0) {
      return res.status(400).json({ success: false, message: 'Incorrect or expired OTP code.' });
    }

    const tokenRow = rows[0];

    // Mark OTP row as used
    await getAdminSupabase().from('password_reset_tokens').update({ used: true, used_at: new Date().toISOString() }).eq('id', tokenRow.id);

    // Generate actual temporary reset token (long random string) and store its hash in DB
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');
    const resetExpiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString(); // 1 hour

    const { error: insertErr } = await getAdminSupabase().from('password_reset_tokens').insert([{
      customer_id: customerId,
      token_hash: resetTokenHash,
      expires_at: resetExpiresAt
    }]);

    if (insertErr) {
      console.error('[AUTH] Failed to insert reset token into DB:', insertErr.message || insertErr);
      return res.status(500).json({ success: false, message: 'Failed to create reset token.' });
    }

    // Return the reset token to the client so they can call /reset-password; do NOT log it.
    res.json({ success: true, token: resetToken });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Endpoint to reset password
router.post('/reset-password', async (req, res) => {
  const { customerId, token, password } = req.body;
  if (!customerId || !token || !password) return res.status(400).json({ success: false, message: 'customerId, token and password are required' });

  try {
    const tokenHash = crypto.createHash('sha256').update(String(token)).digest('hex');
    const now = new Date().toISOString();

    // Find matching, unused token
    const { data: rows, error } = await getAdminSupabase()
      .from('password_reset_tokens')
      .select('*')
      .eq('customer_id', customerId)
      .eq('token_hash', tokenHash)
      .eq('used', false)
      .gt('expires_at', now)
      .order('created_at', { ascending: false })
      .limit(1);

    if (error) {
      console.error('[AUTH] Reset token lookup error:', error.message || error);
      return res.status(500).json({ success: false, message: 'Token verification failed' });
    }

    if (!rows || rows.length === 0) {
      return res.status(400).json({ success: false, message: 'Invalid or expired reset token.' });
    }

    const tokenRow = rows[0];

    // Hash the provided password for storage. Use a strong KDF (scrypt) with ENCRYPTION_SALT
    const salt = process.env.ENCRYPTION_SALT || 'static_salt';
    const keyLen = 64;
    const passwordHash = crypto.scryptSync(String(password), salt, keyLen).toString('hex');

    // Update the customer's password (use admin client to bypass RLS)
    const { error: updateErr } = await getAdminSupabase()
      .from('customers')
      .update({ password: passwordHash })
      .eq('id', customerId);

    if (updateErr) {
      console.error('[AUTH] Failed to update customer password:', updateErr.message || updateErr);
      return res.status(500).json({ success: false, message: 'Failed to update password.' });
    }

    // Also update Supabase Auth so they can log in
    try {
      const { error: authUpdateErr } = await getAdminSupabase().auth.admin.updateUserById(customerId, {
        password: password
      });
      if (authUpdateErr) {
        console.error('[AUTH] Failed to update customer password in Supabase Auth:', authUpdateErr.message);
      } else {
        console.log(`[AUTH] Successfully updated customer ${customerId} password in Supabase Auth`);
      }
    } catch (authErr: any) {
      console.error('[AUTH] Error during self-reset Supabase Auth update:', authErr.message);
    }

    // Mark token as used
    await getAdminSupabase().from('password_reset_tokens').update({ used: true, used_at: new Date().toISOString() }).eq('id', tokenRow.id);

    res.json({ success: true, message: 'Password updated successfully.' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/update', async (req, res) => {
  const attributes = req.body;
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ success: false, error: 'Unauthorized' });
  }

  try {
    const { data: user, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const { data, error } = await supabase.auth.updateUser(attributes);
    if (error) {
      return res.status(400).json({ success: false, error: error.message });
    }

    if (attributes.password && user.user) {
      try {
        const salt = process.env.ENCRYPTION_SALT || 'static_salt';
        const keyLen = 64;
        const passwordHash = crypto.scryptSync(String(attributes.password), salt, keyLen).toString('hex');
        await getAdminSupabase()
          .from('customers')
          .update({ password: passwordHash })
          .eq('id', user.user.id);
        console.log(`[AUTH] Successfully synced database password for customer ${user.user.id}`);
      } catch (dbSyncErr: any) {
        console.error('[AUTH] Failed to sync database password for customer:', dbSyncErr.message);
      }
    }

    res.json({ success: true, data });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/me', async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ success: false, error: 'Unauthorized' });
  }

  const token = authHeader.replace('Bearer ', '').trim();
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    if (userError || !user) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    let { data: customer, error: custError } = await getAdminSupabase()
      .from('customers')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();

    if (custError) {
      return res.status(500).json({ success: false, error: custError.message });
    }

    if (!customer) {
      // Fallback check sellers table
      const { data: seller } = await getAdminSupabase()
        .from('sellers')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();
      if (seller) {
        customer = seller;
      }
    }

    if (!customer) {
      return res.status(404).json({ success: false, error: 'Customer profile not found' });
    }

    res.json({
      success: true,
      customer: {
        id: customer.id,
        name: customer.name,
        phone: customer.phone,
        email: customer.email,
        status: customer.status || 'active',
        preferred_language: customer.preferred_language || 'sw',
        tin: customer.tin || '',
        block_reason: customer.block_reason || customer.blockReason || ''
      }
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
