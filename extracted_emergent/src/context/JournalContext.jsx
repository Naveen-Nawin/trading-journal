import { createContext, useContext, useEffect, useState } from "react";

const Ctx = createContext(null);

export function JournalProvider({ children }) {
  const [currency, setCurrency] = useState(() => localStorage.getItem("fx_currency") || "USD");
  const [tradeDialog, setTradeDialog] = useState({ open: false, trade: null });
  const [closeDialog, setCloseDialog] = useState({ open: false, trade: null });
  const [lightbox, setLightbox] = useState(null);

  useEffect(() => {
    localStorage.setItem("fx_currency", currency);
  }, [currency]);

  const openTradeForm = (trade = null) => setTradeDialog({ open: true, trade });
  const closeTradeForm = () => setTradeDialog({ open: false, trade: null });
  const openCloseForm = (trade) => setCloseDialog({ open: true, trade });
  const closeCloseForm = () => setCloseDialog({ open: false, trade: null });

  return (
    <Ctx.Provider
      value={{
        currency, setCurrency,
        tradeDialog, openTradeForm, closeTradeForm,
        closeDialog, openCloseForm, closeCloseForm,
        lightbox, setLightbox,
      }}
    >
      {children}
    </Ctx.Provider>
  );
}

export const useJournal = () => useContext(Ctx);
