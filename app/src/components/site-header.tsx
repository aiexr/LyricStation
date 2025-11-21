import React from 'react';

const setHeaderHeight = (el: HTMLElement | null) => {
  if (!el) return;
  const update = () => {
    const height = el.getBoundingClientRect().height;
    document.documentElement.style.setProperty(
      '--site-header-height',
      `${height}px`,
    );
  };
  update();
  const ro = new ResizeObserver(update);
  ro.observe(el);
  return () => ro.disconnect();
};

interface Props {
  onHomeClick?: () => void;
}

const SiteHeader: React.FC<Props> = ({ onHomeClick }) => {
  const ref = React.useRef<HTMLElement>(null);
  React.useEffect(() => setHeaderHeight(ref.current), []);
  return (
    <header className="site-header" ref={ref} style={{ textAlign: 'center' }}>
      <h1 style={{ margin: '1rem 0', fontWeight: '700' }}>
        {onHomeClick ? (
          <button
            type="button"
            onClick={onHomeClick}
            style={{
              background: 'none',
              border: 'none',
              padding: 0,
              color: 'inherit',
              textDecoration: 'none',
              cursor: 'pointer',
              font: 'inherit',
            }}
          >
            LyricStation
          </button>
        ) : (
          <a href="/" style={{ color: 'inherit', textDecoration: 'none' }}>
            LyricStation
          </a>
        )}
      </h1>
    </header>
  );
};

export default SiteHeader;
