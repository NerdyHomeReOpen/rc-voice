/* eslint-disable @typescript-eslint/no-unused-vars */
import CreateServerModal from '@/components/modals/CreateServerModal';
import React, { createContext, useContext, useState } from 'react';

type ModalContent = {
  isOpen: boolean;
  modalType: string | null;
  openModal: (type: string) => void;
  closeModal: () => void;
};

const ModalContext = createContext<ModalContent>({
  isOpen: false,
  modalType: null,
  openModal: () => {},
  closeModal: () => {},
});

export const useModal = () => useContext(ModalContext);

interface ModalProviderProps {
  children: React.ReactNode;
}

export const ModalProvider = ({ children }: ModalProviderProps) => {
  const [modalType, setModalType] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState<boolean>(false);

  const openModal = (type: string) => {
    setModalType(type);
    setIsOpen(true);
  };

  const closeModal = () => {
    setIsOpen(false);
    setModalType(null);
  };

  return (
    <ModalContext.Provider value={{ isOpen, modalType, openModal, closeModal }}>
      {children}
    </ModalContext.Provider>
  );
};
