export default function Footer() {
    return (
      <footer className="app-footer">
        <div className="footer-group">
          <span>
            © {new Date().getFullYear()} Yusuf Flower Mills LTD
          </span>
        </div>
        <div className="footer-group">
          <span>
            Developed by{' '}
            <a href="https://onexero.netlify.app" target="_blank" rel="noreferrer">
              Onexero
            </a>
          </span>
          <span>
            Developer:{' '}
            <a href="https://alveehossain.netlify.app" target="_blank" rel="noreferrer">
              Alvee Hossain
            </a>
          </span>
        </div>
      </footer>
    )
  }