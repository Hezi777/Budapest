import { Converter } from "@/components/converter";

export default function MoneyPage() {
  return (
    <>
      <h1 className="page-title">כמה זה בשקלים?</h1>
      <p className="page-lead">מקלידים מחיר בפורינט ורואים מיד כמה זה בשקלים. אפשר גם הפוך.</p>
      <Converter />
    </>
  );
}
