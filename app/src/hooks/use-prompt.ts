import { useRef, useState } from 'react';

export default function usePrompt() {
  const [promptVisible, setPromptVisible] = useState(false);
  const [promptTitle, setPromptTitle] = useState('');
  const [promptInitial, setPromptInitial] = useState('');
  const promptResolver = useRef<((value: string | null) => void) | null>(null);

  const showPrompt = (title: string, initial = ''): Promise<string | null> => {
    setPromptTitle(title);
    setPromptInitial(initial);
    setPromptVisible(true);
    return new Promise((resolve) => {
      promptResolver.current = resolve;
    });
  };

  const handlePromptCancel = () => {
    setPromptVisible(false);
    promptResolver.current?.(null);
  };

  const handlePromptSubmit = (val: string) => {
    setPromptVisible(false);
    promptResolver.current?.(val);
  };

  return {
    promptVisible,
    promptTitle,
    promptInitial,
    showPrompt,
    handlePromptCancel,
    handlePromptSubmit,
  };
}
