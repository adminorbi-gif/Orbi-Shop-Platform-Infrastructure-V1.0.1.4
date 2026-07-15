const fs = require('fs');
const file = 'src/pages/AdminApp/components/index.tsx';
let content = fs.readFileSync(file, 'utf8');

const targetLabelEnField = `                      <div className="lg:col-span-2">
                        <label className="mb-1 block text-[9px] font-black uppercase tracking-wider text-slate-400">
                          {isSw ? "Label Kiingereza" : "English label"}
                        </label>
                        <input
                          value={zone.labelEn || ""}
                          onChange={(e) => {
                            const copy = [...deliveryZones];
                            copy[idx] = { ...copy[idx], labelEn: e.target.value };
                            setDeliveryZones(copy);
                          }}
                          className="w-full rounded-2xl border border-slate-200 bg-white p-3 text-xs font-bold outline-none focus:border-blue-600"
                          placeholder="Other regions"
                        />
                      </div>`;

const b2bHubFields = `                      <div className="lg:col-span-2 flex flex-col justify-end pb-3">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={!!zone.isB2bHub}
                            onChange={(e) => {
                              const copy = [...deliveryZones];
                              copy[idx] = { ...copy[idx], isB2bHub: e.target.checked };
                              setDeliveryZones(copy);
                            }}
                            className="w-4 h-4 rounded text-blue-600 focus:ring-blue-600"
                          />
                          <span className="text-[11px] font-black uppercase tracking-wider text-slate-700">
                            {isSw ? "Hiki ni Kituo cha B2B?" : "Is B2B Hub?"}
                          </span>
                        </label>
                      </div>
                      {zone.isB2bHub && (
                        <div className="lg:col-span-2">
                          <label className="mb-1 block text-[9px] font-black uppercase tracking-wider text-slate-400">
                            {isSw ? "Jina la Hub" : "Hub Name"}
                          </label>
                          <input
                            value={zone.b2bHubName || ""}
                            onChange={(e) => {
                              const copy = [...deliveryZones];
                              copy[idx] = { ...copy[idx], b2bHubName: e.target.value };
                              setDeliveryZones(copy);
                            }}
                            className="w-full rounded-2xl border border-slate-200 bg-white p-3 text-xs font-bold outline-none focus:border-blue-600"
                            placeholder={isSw ? "Mfano: Kariakoo Hub" : "e.g. Kariakoo Hub"}
                          />
                        </div>
                      )}`;

content = content.replace(targetLabelEnField, targetLabelEnField + '\n' + b2bHubFields);

const targetSaveZone = `        name: (zone.name || zone.labelSw || zone.labelEn || "").trim(),
        labelSw: (zone.labelSw || zone.name || "").trim(),
        labelEn: (zone.labelEn || zone.name || "").trim(),`;

const replaceSaveZone = `        name: (zone.name || zone.labelSw || zone.labelEn || "").trim(),
        labelSw: (zone.labelSw || zone.name || "").trim(),
        labelEn: (zone.labelEn || zone.name || "").trim(),
        isB2bHub: !!zone.isB2bHub,
        b2bHubName: (zone.b2bHubName || "").trim(),`;

content = content.replace(targetSaveZone, replaceSaveZone);

fs.writeFileSync(file, content, 'utf8');
