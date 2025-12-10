import PrivacyPage from "@/components/PrivacyPage";

const COMPANY_INFO = {
  name: "Ignite Channel",
  email: "info@ignitechannel.com",
  address: "30765 Pacific Coast Hwy, Suite 354",
  location: "Malibu, CA",
  updatedAt: "November 1, 2023",
} as const;

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
