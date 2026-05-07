export default function PhotoshopLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="photoshop-dark fixed left-0 right-0 top-14 bottom-0 overflow-hidden">
      {children}
    </div>
  );
}
