import TermsPage from "@/components/TermsPage";

const COMPANY_INFO = {
  name: "Ignite Channel",
  email: "info@ignitechannel.com",
  updatedAt: "November 1, 2023",
} as const;

export default function Terms() {
  return (
    <TermsPage
      privacyLink="/privacy"
      companyName={COMPANY_INFO.name}
      companyEmail={COMPANY_INFO.email}
      updatedAt={COMPANY_INFO.updatedAt}
    />
  );
}

