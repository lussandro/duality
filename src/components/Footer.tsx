import { FaWhatsapp, FaTelegram } from 'react-icons/fa';

export default function Footer({}) {
  const handleDiscord = () => {
    window.open('/whatsapp');
  };

  const handleTelegram = () => {
    window.open('/telegram');
  };
  return (
    <footer className="fixed bottom-0 left-[1/2] right-[1/2] w-auto py-4">
      <div className="flex justify-center items-center">
        <FaWhatsapp
          className="opacity-50 text-blue-500 hover:text-blue-600 transition-all duration-300 w-12 h-12 cursor-pointer mx-2"
          onClick={handleDiscord}
        />
        <FaTelegram
          className="opacity-50 text-blue-500 hover:text-blue-600 transition-all duration-300 w-12 h-12 cursor-pointer mx-2"
          onClick={handleTelegram}
        />
      </div>
    </footer>
  );
}
