// src/app/(admin)/academic/setup/layout.tsx
export default function AcademicSetupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      {children}
    </div>
  );
}