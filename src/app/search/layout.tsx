// 📘 Day 10: the search layout has 2 slots:
//   children ← search/page.tsx   (the search box and results)
//   modal    ← search/@modal/…   (a post preview, or nothing)
// Both render at the same time. The modal sits on top of the results, so when
// you close it, your search and your page number are still there.
export default function SearchLayout({ children, modal }: LayoutProps<'/search'>) {
  return (
    <>
      {children}
      {modal}
    </>
  );
}
