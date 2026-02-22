export default function ColorGridLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center p-6">
      {children}
    </div>
  );
}
