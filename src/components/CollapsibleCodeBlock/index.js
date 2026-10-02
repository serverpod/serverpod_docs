/**
 * Wraps a fenced code block and shows only its first lines until expanded.
 * Set `collapsedHeight` (any CSS length) to control how much shows.
 * Long lines wrap instead of scrolling. The copy button is unaffected and
 * always copies the full code.
 */
import React, {useState} from 'react';
import clsx from 'clsx';
import styles from './styles.module.css';

export default function CollapsibleCodeBlock({
  children,
  expandLabel = 'Show all',
  collapseLabel = 'Show less',
  collapsedHeight = '6rem',
}) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div
      className={clsx(styles.container, !expanded && styles.collapsed)}
      style={{'--collapsed-height': collapsedHeight}}>
      {children}
      <button
        type="button"
        className={styles.toggle}
        aria-expanded={expanded}
        onClick={() => setExpanded((value) => !value)}>
        {expanded ? collapseLabel : expandLabel}
      </button>
    </div>
  );
}
