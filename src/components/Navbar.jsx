"use client";
import { Navbar } from "keep-react";
import { Link } from "react-router-dom";

export const NavbarComponent = () => {
  return (
    <Navbar fluid={false} className="bg-gray-100 mb-10">
      <Navbar.Container className="flex items-center justify-between mb-4 py-8">
        <Navbar.Brand>
          <Link to={'/'}>
            <h2>Bangla Sign Language Detection System</h2>
          </Link>
        </Navbar.Brand>
        <Link to={'/speech-to-sign'}>Speech To Sign</Link>
      </Navbar.Container>
    </Navbar>
  );
}


export default Navbar;
