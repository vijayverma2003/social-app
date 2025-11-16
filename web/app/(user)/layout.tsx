import { PropsWithChildren } from "react";
import MainHeader from "./components/MainHeader";
import Navbar from "./components/Navbar";

const Layout = ({ children }: PropsWithChildren) => {
  return (
    <div className="flex max-h-screen">
      <Navbar />
      <main className="flex flex-1 flex-col overflow-hidden">
        <MainHeader />
        <div className="flex-1 overflow-y-auto p-4">{children}</div>
      </main>
    </div>
  );
};

export default Layout;
