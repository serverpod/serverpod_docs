/**
 * Swizzled from @docusaurus/theme-classic to strip leading shell prompts
 * (`$ `) from text written to the clipboard. The prompt remains visible
 * in the rendered code block, but the copied text is the runnable command.
 */
import React, {useCallback, useState, useRef, useEffect} from 'react';
import clsx from 'clsx';
import {translate} from '@docusaurus/Translate';
import {useCodeBlockContext} from '@docusaurus/theme-common/internal';
import Button from '@theme/CodeBlock/Buttons/Button';
import IconCopy from '@theme/Icon/Copy';
import IconSuccess from '@theme/Icon/Success';
import styles from './styles.module.css';

function stripShellPrompts(code) {
  if (typeof code !== 'string' || code.length === 0) {
    return code;
  }
  const lines = code.split('\n');
  const nonEmpty = lines.filter((line) => line.trim().length > 0);
  if (nonEmpty.length === 0) {
    return code;
  }
  const allPrompted = nonEmpty.every((line) => /^\s*\$\s+/.test(line));
  if (!allPrompted) {
    return code;
  }
  return lines
    .map((line) =>
      line.trim().length === 0 ? line : line.replace(/^(\s*)\$\s+/, '$1'),
    )
    .join('\n');
}

function title() {
  return translate({
    id: 'theme.CodeBlock.copy',
    message: 'Copy',
    description: 'The copy button label on code blocks',
  });
}

function ariaLabel(isCopied) {
  return isCopied
    ? translate({
        id: 'theme.CodeBlock.copied',
        message: 'Copied',
        description: 'The copied button label on code blocks',
      })
    : translate({
        id: 'theme.CodeBlock.copyButtonAriaLabel',
        message: 'Copy code to clipboard',
        description: 'The ARIA label for copy code blocks button',
      });
}

async function copyToClipboard(text) {
  if (navigator.clipboard) {
    return navigator.clipboard.writeText(text);
  }
  const {default: copy} = await import('copy-text-to-clipboard');
  return copy(text);
}

function useCopyButton() {
  const {
    metadata: {code},
  } = useCodeBlockContext();
  const [isCopied, setIsCopied] = useState(false);
  const copyTimeout = useRef(undefined);
  const copyCode = useCallback(() => {
    copyToClipboard(stripShellPrompts(code)).then(() => {
      setIsCopied(true);
      copyTimeout.current = window.setTimeout(() => {
        setIsCopied(false);
      }, 1000);
    });
  }, [code]);
  useEffect(() => () => window.clearTimeout(copyTimeout.current), []);
  return {copyCode, isCopied};
}

export default function CopyButton({className}) {
  const {copyCode, isCopied} = useCopyButton();
  return (
    <Button
      aria-label={ariaLabel(isCopied)}
      title={title()}
      className={clsx(
        className,
        styles.copyButton,
        isCopied && styles.copyButtonCopied,
      )}
      onClick={copyCode}>
      <span className={styles.copyButtonIcons} aria-hidden="true">
        <IconCopy className={styles.copyButtonIcon} />
        <IconSuccess className={styles.copyButtonSuccessIcon} />
      </span>
    </Button>
  );
}
