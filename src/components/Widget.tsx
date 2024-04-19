import { useRouter } from 'next/router';
import { IconType } from 'react-icons';
import React from 'react';

interface WidgetProps {
  icon: IconType;
  title: string;
  description: string;
  redirectUrl: string;
}

const Widget: React.FC<WidgetProps> = ({ icon: Icon, title, description, redirectUrl }) => {
  const router = useRouter();

  const handleClick = () => {
    if (redirectUrl) {
      router.push(redirectUrl);
    }
  };

  return (
    <div
      className="flex flex-col items-center h-56 w-30 sm:w-40 2xl:w-48 bg-secundary rounded-xl p-4 cursor-pointer lg:hover:scale-110 lg:hover:bg-tertiary transition-all duration-300"
      onClick={handleClick}
    >
      <div className="text-5xl mb-4 flex items-start">
        <Icon />
      </div>
      <h2 className="text-xl font-bold mb-2">{title}</h2>
      <p className="text-center text-text-secundary">{description}</p>
    </div>
  );
};

export default Widget;
