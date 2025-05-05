import React, { useState, useRef, useEffect } from 'react';

export default function ChatWithAutoScroll() {
  const [messages, setMessages] = useState([
    { id: 1, text: 'Witaj! To jest początek naszej konwersacji.', isAssistant: true },
    { id: 2, text: 'Cześć! Jak działa to automatyczne przewijanie?', isAssistant: false },
  ]);
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [currentText, setCurrentText] = useState('');
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true);
  
  const messagesEndRef = useRef(null);
  const chatContainerRef = useRef(null);
  const isUserScrolling = useRef(false);
  const lastScrollHeight = useRef(0);
  const lastScrollTop = useRef(0);
  
  // Dodaj nową wiadomość od użytkownika
  const handleSendMessage = () => {
    if (newMessage.trim() === '') return;
    
    const userMessage = {
      id: messages.length + 1,
      text: newMessage,
      isAssistant: false
    };
    
    setMessages(prev => [...prev, userMessage]);
    setNewMessage('');
    setShouldAutoScroll(true);
    
    // Symulacja odpowiedzi asystenta
    setIsTyping(true);
    simulateResponse();
  };
  
  // Symulacja stopniowego pisania odpowiedzi (imitacja Claude)
  const simulateResponse = () => {
    const sampleResponse = "To jest przykładowa odpowiedź asystenta, która pojawia się stopniowo jak w Claude. Automatyczne przewijanie śledzi nowy tekst, chyba że użytkownik samodzielnie przewinie ekran. Wtedy przewijanie zostaje 'odklejone' aż użytkownik znów kliknie w okno czatu lub pojawi się nowa wiadomość. Mam nadzieję, że ta implementacja odpowiada Twoim oczekiwaniom! Gdy tekst jest długi, system inteligentnie utrzymuje przewijanie, nie 'odkleja' się przy dużych fragmentach tekstu.";
    
    setCurrentText('');
    let index = 0;
    
    const typeNextChar = () => {
      if (index < sampleResponse.length) {
        setCurrentText(prev => prev + sampleResponse.charAt(index));
        index++;
        setTimeout(typeNextChar, Math.random() * 30 + 10);
      } else {
        setIsTyping(false);
        setMessages(prev => [...prev, {
          id: messages.length + 2,
          text: sampleResponse,
          isAssistant: true
        }]);
        setCurrentText('');
      }
    };
    
    setTimeout(typeNextChar, 500);
  };
  
  // Obsługa scrollowania
  useEffect(() => {
    const chatContainer = chatContainerRef.current;
    if (!chatContainer) return;
    
    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = chatContainer;
      const isAtBottom = scrollHeight - scrollTop - clientHeight < 10;
      
      // Wykryj czy użytkownik przewija w górę (przeciwnie do auto-scroll)
      if (!isAtBottom && lastScrollTop.current <= scrollTop) {
        isUserScrolling.current = true;
        setShouldAutoScroll(false);
      }
      
      // Wykryj czy użytkownik przewinął na dół manualnie
      if (isAtBottom && isUserScrolling.current) {
        isUserScrolling.current = false;
        setShouldAutoScroll(true);
      }
      
      lastScrollTop.current = scrollTop;
    };
    
    chatContainer.addEventListener('scroll', handleScroll);
    return () => chatContainer.removeEventListener('scroll', handleScroll);
  }, []);
  
  // Przewijanie na sam dół przy nowych wiadomościach
  useEffect(() => {
    if (shouldAutoScroll && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, shouldAutoScroll]);
  
  // Przewijanie podczas pisania
  useEffect(() => {
    const chatContainer = chatContainerRef.current;
    
    if (isTyping && shouldAutoScroll && chatContainer && currentText) {
      const { scrollHeight, scrollTop, clientHeight } = chatContainer;
      
      // Sprawdź czy pojawiła się znaczna zmiana wysokości kontenera
      const heightDifference = scrollHeight - lastScrollHeight.current;
      
      if (heightDifference > 0) {
        // Przewiń do dołu jeśli nowy tekst dodał znaczną wysokość
        messagesEndRef.current.scrollIntoView({ behavior: heightDifference > 50 ? 'smooth' : 'auto' });
      }
      
      lastScrollHeight.current = scrollHeight;
    }
  }, [currentText, isTyping, shouldAutoScroll]);

  // Przywracanie auto-scroll po kliknięciu w kontener
  const handleContainerClick = () => {
    setShouldAutoScroll(true);
    isUserScrolling.current = false;
  };
  
  return (
    <div className="flex flex-col h-screen max-h-screen bg-gray-100">
      <div className="p-4 shadow bg-white">
        <h1 className="text-xl font-bold">Chat z automatycznym scrollem</h1>
        <p className="text-sm text-gray-600">
          Status auto-scroll: {shouldAutoScroll ? 'Aktywny' : 'Nieaktywny'} 
          {!shouldAutoScroll && ' (kliknij w okno czatu, aby aktywować)'}
        </p>
      </div>
      
      <div 
        ref={chatContainerRef} 
        className="flex-1 overflow-y-auto p-4 space-y-4" 
        onClick={handleContainerClick}
      >
        {messages.map(message => (
          <div 
            key={message.id} 
            className={`p-3 rounded-lg max-w-3/4 ${
              message.isAssistant 
                ? 'bg-blue-100 text-blue-800' 
                : 'bg-gray-200 text-gray-800 ml-auto'
            }`}
          >
            {message.text}
          </div>
        ))}
        
        {isTyping && (
          <div className="p-3 rounded-lg max-w-3/4 bg-blue-100 text-blue-800">
            {currentText}
            <span className="animate-pulse">▋</span>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>
      
      <div className="p-4 border-t bg-white">
        <div className="flex space-x-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            className="flex-1 p-2 border rounded-lg"
            placeholder="Napisz wiadomość..."
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
          />
          <button
            onClick={handleSendMessage}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg"
          >
            Wyślij
          </button>
        </div>
      </div>
    </div>
  );
}
