export function controlPrompt(key, { mobile = false } = {}) {
  if (mobile) {
    switch (key) {
      case "move": return "スティック";
      case "z": return "A";
      case "x": return "B";
      case "c": return "C";
      case "s": return "SAVE";
      case "l": return "LOAD";
      default: return key;
    }
  }

  switch (key) {
    case "move": return "矢印/十字";
    case "z": return "Z";
    case "x": return "X";
    case "c": return "C";
    case "s": return "S";
    case "l": return "L";
    default: return key;
  }
}

export function controlPromptRows({ mobile = false } = {}) {
  if (mobile) {
    return [
      [controlPrompt("move", { mobile }), "いどう"],
      [controlPrompt("z", { mobile }), "けってい・はなす"],
      [controlPrompt("x", { mobile }), "メニュー・キャンセル"],
      [controlPrompt("c", { mobile }), "ダッシュ"],
      [controlPrompt("s", { mobile }), "セーブ"],
      [controlPrompt("l", { mobile }), "ロード"],
    ];
  }

  return [
    ["矢印/十字", "いどう"],
    ["Z/A", "けってい・はなす"],
    ["X/B", "メニュー・キャンセル"],
    ["C", "ダッシュ"],
    ["S/L1", "セーブ"],
    ["L/R1", "ロード"],
  ];
}
