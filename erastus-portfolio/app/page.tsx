import Navbar from "../components/navbar";
import HomeComp from "../components/home";
import WorkServer from "@/components/WorkServer";
import About from "../components/About";
import ScrollIndicator from "../components/ScrollIndicator";
import styles from "../components/navbar.module.css";
import Contact from "@/components/Contact";
import "./globals.css";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen" style={{ backgroundColor: "#040404" }}>
      <header className="sticky top-0 z-50 flex justify-center pt-6">
        <div className={styles.NavbarBlurMask} />
        <Navbar />
      </header>
      
      <section id="Home" className="flex justify-center items-center min-h-screen -mt-20">
        <HomeComp />
      </section>

      <main id="page-content">
        <section id="Projects" className="flex justify-center items-center min-h-screen">
          <WorkServer />
        </section>
        <section id="About" className="flex justify-center items-center min-h-screen">
          <About />
        </section>
        <section id="contact" className="flex justify-center items-center min-h-screen">
          <Contact/>
        </section>
      </main>

      <ScrollIndicator />
    </div>
  );
}