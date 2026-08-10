export default function Footer() {
  return (
    <footer className="mt-5 py-4">
      <div className="container text-center">
        <p className="mb-1">
          <i className="bi bi-book-half me-1"></i> Librería XP — Sistema de ventas de libros
        </p>
        <p className="mb-0 small text-muted">
          Stack: MongoDB · Express · React · Node | {new Date().getFullYear()}
        </p>
      </div>
    </footer>
  );
}