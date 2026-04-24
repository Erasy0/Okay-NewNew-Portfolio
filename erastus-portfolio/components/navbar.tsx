import styles from "./navbar.module.css"

export default function Navbar() {  
    return (
        <>
          
            <nav className={styles.Navbar}>
                <ul className={`${styles.NavList} flex gap-8`}>
                    <li className={styles.NavItem}><a href="#Home">Home</a></li>
                    <li className={styles.NavItem}><a href="#Projects">Projects</a></li>
                    <li className={styles.NavItem}><a href="#About">About</a></li>
                    <li className={styles.NavItem}><a href="#contact">Contact</a></li>
                </ul>
            </nav>
        </>
    )
}