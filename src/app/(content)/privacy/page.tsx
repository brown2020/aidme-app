import PrivacyPage from "@/components/PrivacyPage";
import { COMPANY_INFO } from "@/lib/constants";

export default function Privacy() {
  return (
    <PrivacyPage
      companyName={COMPANY_INFO.name}
      companyEmail={COMPANY_INFO.email}
      companyAddress={COMPANY_INFO.address}
      companyLocation={COMPANY_INFO.location}
      updatedAt={COMPANY_INFO.updatedAt}
    />
  );
}
