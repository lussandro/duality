import { HiLogout, HiOutlineSearch } from 'react-icons/hi';
import { RiAdminLine } from 'react-icons/ri';
import { useRouter } from 'next/router';

interface HeaderProps {
  adminButton?: boolean;
  returnButton?: boolean;
}

export default function Header({ adminButton, returnButton }: HeaderProps) {
  const router = useRouter();

  const handleReturn = () => {
    router.push('/painel');
  };

  const handleAdmin = () => {
    router.push('/admin/painel');
  };

  const handleLogout = () => {
    document.cookie = 'token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    router.push('/');
  };

  return (
    <header className="flex items-center justify-between p-4 mx-5 mt-5 bg-secundary rounded-xl">
      <div className="flex items-center space-x-2">
        <img
          src="/resized-transparent-logo.png"
          className="md:mt-1 mr-2 w-8 h-8 pointer-events-none"
          alt="Logo"
        />
        <h1 className="text-lg md:text-2xl font-bold">FINDY</h1>
      </div>
      <div className="flex items-center space-x-4">
        {returnButton && (
          <button
            type="button"
            className="flex items-center text-blue-500 hover:text-blue-600 transition-all duration-300 text-sm md:text-base font-medium outline-none"
            onClick={handleReturn}
          >
            <HiOutlineSearch className="w-6 h-6" />
          </button>
        )}
        {adminButton && (
          <button
            type="button"
            className="flex items-center text-blue-500 hover:text-blue-600 transition-all duration-300 text-sm md:text-base font-medium outline-none"
            onClick={handleAdmin}
          >
            <RiAdminLine className="w-6 h-6" />
          </button>
        )}
        <button
          type="button"
          className="flex items-center text-red-500 hover:text-red-600 transition-all duration-300 text-sm md:text-base font-medium outline-none"
          onClick={handleLogout}
        >
          <HiLogout className="w-6 h-6" />
        </button>
      </div>
    </header>
  );
}
