export function initNavigation() {
    const hamburgerBtn = document.querySelector('.hamburger-btn');
    const sidebar = document.querySelector('.sidebar-menu');
    const overlay = document.querySelector('.sidebar-overlay');
    const closeBtn = document.querySelector('.sidebar-close');
    const sidebarLinks = document.querySelectorAll('.sidebar-nav a');

    if (!hamburgerBtn || !sidebar || !overlay || !closeBtn) {
        console.warn('Navigation elements not found');
        return;
    }

    function openSidebar() {
        hamburgerBtn.classList.add('active');
        sidebar.classList.add('active');
        overlay.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    function closeSidebar() {
        hamburgerBtn.classList.remove('active');
        sidebar.classList.remove('active');
        overlay.classList.remove('active');
        document.body.style.overflow = '';
    }

    hamburgerBtn.addEventListener('click', () => {
        if (sidebar.classList.contains('active')) {
            closeSidebar();
        } else {
            openSidebar();
        }
    });

    closeBtn.addEventListener('click', closeSidebar);
    overlay.addEventListener('click', closeSidebar);

    sidebarLinks.forEach(link => {
        link.addEventListener('click', () => {
            closeSidebar();
        });
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && sidebar.classList.contains('active')) {
            closeSidebar();
        }
    });
}

export function setActiveNavItem(pageName) {
    const navItems = document.querySelectorAll('.sidebar-nav li');
    navItems.forEach(item => {
        item.classList.remove('active');
        const link = item.querySelector('a');
        if (link && link.getAttribute('href').includes(pageName)) {
            item.classList.add('active');
        }
    });
}