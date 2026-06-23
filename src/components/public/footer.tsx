import { Link } from "@tanstack/react-router";
import { Boxes, Github, Twitter, Linkedin, Mail } from "lucide-react";

export function PublicFooter() {
  return (
    <footer className="border-t border-border bg-card/40">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:grid-cols-2 lg:grid-cols-4 lg:px-8">
        <div>
          <Link to="/" className="flex items-center gap-2">
            <div className="grid h-9 w-9 place-items-center rounded-lg bg-gradient-to-br from-primary to-accent text-primary-foreground">
              <Boxes className="h-5 w-5" />
            </div>
            <span className="text-lg font-bold">LabTrack</span>
          </Link>
          <p className="mt-3 text-sm text-muted-foreground">
            Modern peripheral inventory & procurement platform for computer laboratories.
          </p>
          <div className="mt-4 flex gap-3">
            {[Github, Twitter, Linkedin, Mail].map((I, idx) => (
              <a
                key={idx}
                href="#"
                className="grid h-9 w-9 place-items-center rounded-md border border-border text-muted-foreground hover:bg-secondary hover:text-foreground"
              >
                <I className="h-4 w-4" />
              </a>
            ))}
          </div>
        </div>
        <div>
          <h4 className="text-sm font-semibold">Explore</h4>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li>
              <Link to="/" className="hover:text-foreground">
                Home
              </Link>
            </li>
            <li>
              <Link to="/about" className="hover:text-foreground">
                About
              </Link>
            </li>
            <li>
              <Link to="/products" className="hover:text-foreground">
                Products
              </Link>
            </li>
            <li>
              <Link to="/faq" className="hover:text-foreground">
                FAQ
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <h4 className="text-sm font-semibold">Support</h4>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li>
              <Link to="/contact" className="hover:text-foreground">
                Contact
              </Link>
            </li>
            <li>
              <Link to="/privacy" className="hover:text-foreground">
                Privacy Policy
              </Link>
            </li>
            <li>
              <Link to="/terms" className="hover:text-foreground">
                Terms & Conditions
              </Link>
            </li>
            <li>
              <Link to="/auth" className="hover:text-foreground">
                Staff Login
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <h4 className="text-sm font-semibold">Contact</h4>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li>Computer Science Department</li>
            <li>support@labtrack.app</li>
            <li>+1 (555) 010-2204</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-border py-5 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} LabTrack. Built for academic excellence.
      </div>
    </footer>
  );
}
