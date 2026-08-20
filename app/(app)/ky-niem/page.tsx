import SpecialDaysWidget from "@/components/SpecialDaysWidget";
import RelationshipStartEditor from "@/components/RelationshipStartEditor";

export default function SpecialDaysPage() {
  return (
    <div className="max-w-2xl mx-auto flex flex-col gap-4">
      <div className="paper-card p-5">
        <h1 className="font-display italic text-xl mb-3">Ngày yêu nhau</h1>
        <RelationshipStartEditor />
      </div>
      <SpecialDaysWidget showAddForm />
    </div>
  );
}
