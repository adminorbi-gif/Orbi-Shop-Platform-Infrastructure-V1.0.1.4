const translateSoldBy = (val: string, lang: string) => {
  if (lang !== "sw") return val;
  const map: Record<string, string> = {
    Piece: "Kipande",
    Pair: "Jozi",
    Bundle: "Kifurushi",
    Box: "Boksi",
    Carton: "Katoni",
    Set: "Seti",
    Dozen: "Dazeni",
    Roll: "Roli",
    Meter: "Mita",
    Kg: "Kilo",
    Ltr: "Lita"
  };
  return map[val] || val;
};
