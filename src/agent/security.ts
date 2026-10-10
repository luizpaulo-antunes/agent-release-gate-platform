const injectionPatterns = [
  /ignore (all |the )?(previous|prior|system) instructions/i,
  /reveal (the )?(system|developer) prompt/i,
  /bypass (authorization|security|rbac)/i,
  /(dump|export|exfiltrate) (all )?(customer|tenant|private) (data|records)/i,
  /show (me )?(all|another tenant'?s) (secrets|tokens|records|data)/i,
];

export function detectUnsafeInstruction(question: string): string | undefined {
  if (injectionPatterns.some((pattern) => pattern.test(question))) {
    return "prompt_injection_or_data_exfiltration";
  }
  return undefined;
}
