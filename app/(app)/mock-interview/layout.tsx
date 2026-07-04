export default function MockInterviewLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#FAF6EF]">
      {children}
    </div>
  );
}
