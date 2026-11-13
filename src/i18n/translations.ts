export type Language = 'it' | 'en' | 'ro';

export type CategoryId =
  | 'all'
  | 'funko'
  | 'plush'
  | 'gaming'
  | 'streaming'
  | 'accessories'
  | 'favorites';

export type SortOrder = 'default' | 'az' | 'za';

export interface Translations {
  meta: {
    title: string;
    description: string;
  };
  nav: {
    catalog: string;
    favorites: string;
    howItWorks: string;
    languageLabel: string;
  };
  hero: {
    kickerPrefix: string;
    wishlistCountUnit: string;
    savedCountUnit: string;
    subtitle: string;
    intro: string;
    exploreCta: string;
    favoritesCta: string;
    imageAlt: string;
  };
  categories: Record<CategoryId, string>;
  statuses: {
    available: string;
    reserved: string;
    purchase_declared: string;
    confirmed: string;
    received: string;
  };
  controls: {
    searchPlaceholder: string;
    searchLabel: string;
    clearSearch: string;
    sortLabel: string;
    sortDefault: string;
    sortAz: string;
    sortZa: string;
    showingPrefix: string;
    showingMiddle: string;
    showingSuffix: string;
    resetFilters: string;
    myReservationsButton: string;
  };
  card: {
    reserveButton: string;
    reservingButton: string;
    buyButton: string;
    buyAriaPrefix: string;
    linkUpdating: string;
    storePending: string;
    addFavorite: string;
    removeFavorite: string;
    imagePendingNote: string;
    receivedLabel: string;
  };
  reservation: {
    modalTitle: string;
    modalSubtitle: string;
    codeLabel: string;
    copyCode: string;
    copiedCode: string;
    expiresLabel: string;
    expiryRule: string;
    goToStore: string;
    noteLabel: string;
    notePlaceholder: string;
    declareBoughtButton: string;
    cancelReservationButton: string;
    declaredSuccessTitle: string;
    declaredSuccessBody: string;
    cancelledSuccess: string;
    lookupHeading: string;
    lookupPlaceholder: string;
    lookupButton: string;
    lookupNotFound: string;
    activeBannerTitle: string;
    manageButton: string;
    errorAlreadyReserved: string;
    errorLimitReached: string;
    errorNotSynced: string;
    errorExpired: string;
    close: string;
  };
  favoritesBar: {
    title: string;
    copyList: string;
    copied: string;
    clearAll: string;
    confirmClear: string;
    cancelClear: string;
  };
  empty: {
    searchTitle: string;
    searchBody: string;
    favoritesTitle: string;
    favoritesBody: string;
    backToAll: string;
  };
  deliverySection: {
    heading: string;
    point1: string;
    point2: string;
    point3: string;
    point4: string;
    point5: string;
    amazonCta: string;
    authorizedNoteTitle: string;
  };
  howItWorks: {
    heading: string;
    lead: string;
    step1Title: string;
    step1Body: string;
    step2Title: string;
    step2Body: string;
    step3Title: string;
    step3Body: string;
    privacyNote: string;
  };
  footer: {
    tagline: string;
    disclaimer: string;
    localPrivacy: string;
    privateAreaButton: string;
  };
  admin: {
    title: string;
    subtitle: string;
    close: string;
    signOut: string;
    loginTitle: string;
    loginSubtitle: string;
    googleLogin: string;
    emailLabel: string;
    passwordLabel: string;
    signInEmail: string;
    registerInvite: string;
    forgotPassword: string;
    resetSent: string;
    providerNotice: string;
    verifyEmailTitle: string;
    verifyEmailBody: string;
    resendVerification: string;
    verificationSent: string;
    refreshStatus: string;
    unauthorizedTitle: string;
    unauthorizedBody: string;
    tabs: {
      products: string;
      reservations: string;
      addresses: string;
      publicNotes: string;
      security: string;
    };
    productsPanel: {
      addNew: string;
      syncInitial: string;
      syncedSuccess: string;
      editItem: string;
      receivedToggle: string;
      receivedBadge: string;
      pendingBadge: string;
      deleteConfirm: string;
      deleteAction: string;
      cancel: string;
      save: string;
      nameLabel: string;
      brandLabel: string;
      categoryLabel: string;
      storeLabel: string;
      urlLabel: string;
      imageLabel: string;
      imageHint: string;
      descItLabel: string;
      descEnLabel: string;
      descRoLabel: string;
      savedMessage: string;
    };
    reservationsPanel: {
      heading: string;
      empty: string;
      confirmPurchase: string;
      rejectDeclaration: string;
      restoreAvailable: string;
      markReceived: string;
      buyerNotePrefix: string;
      expiresAtPrefix: string;
      declaredAtPrefix: string;
    };
    addressesPanel: {
      heading: string;
      privacyBanner: string;
      recipientName: string;
      streetAddress: string;
      cityAndPostal: string;
      country: string;
      amazonLockerName: string;
      amazonLockerAddress: string;
      privateInstructions: string;
      saveButton: string;
      savedMessage: string;
    };
    publicPanel: {
      heading: string;
      intro: string;
      amazonWishlistUrl: string;
      showAmazonWishlist: string;
      publicDeliveryNote: string;
      showPublicDeliveryNote: string;
      hideReceivedFromVisitors: string;
      saveButton: string;
      savedMessage: string;
    };
    securityPanel: {
      heading: string;
      signedInAs: string;
      changePasswordHeading: string;
      currentPassword: string;
      newPassword: string;
      confirmPassword: string;
      updatePasswordButton: string;
      passwordUpdated: string;
      passwordMismatch: string;
      passwordTooShort: string;
      googleAccountNotice: string;
      sendResetEmail: string;
      inviteHeading: string;
      inviteHelp: string;
      inviteEmailLabel: string;
      saveInviteButton: string;
      inviteSaved: string;
    };
  };
}

export const TRANSLATIONS: Record<Language, Translations> = {
  it: {
    meta: {
      title: "Sarah's Wishlist ♡",
      description: "Un piccolo mondo di desideri, tutto per Sarah ♡",
    },
    nav: {
      catalog: 'Catalogo',
      favorites: 'Preferiti ♡',
      howItWorks: 'Come funziona',
      languageLabel: 'Seleziona lingua',
    },
    hero: {
      kickerPrefix: 'Collezione curata',
      wishlistCountUnit: 'desideri disponibili',
      savedCountUnit: 'preferiti',
      subtitle: 'Un piccolo mondo di desideri, tutto per Sarah ♡',
      intro:
        'Dalle figure da collezione e i peluche anime ai componenti per il setup gaming e streaming: prenota un desiderio per evitare regali doppi e acquista direttamente dal negozio ufficiale o affidabile.',
      exploreCta: 'Esplora i desideri',
      favoritesCta: 'Vedi preferiti ♡',
      imageAlt:
        'Composizione pastello per la wishlist di Sarah con accessori anime e gaming',
    },
    categories: {
      all: 'Tutti i desideri',
      funko: 'Funko Pop! Anime',
      plush: 'Peluche Anime',
      gaming: 'Gaming e PC',
      streaming: 'Streaming e Live',
      accessories: 'Accessori e Regali',
      favorites: 'Preferiti ♡',
    },
    statuses: {
      available: 'Disponibile',
      reserved: 'Prenotato',
      purchase_declared: 'Acquisto dichiarato',
      confirmed: 'Acquistato confermato',
      received: 'Ricevuto',
    },
    controls: {
      searchPlaceholder: 'Cerca un desiderio, modello o negozio...',
      searchLabel: 'Cerca prodotti nella wishlist',
      clearSearch: 'Cancella ricerca',
      sortLabel: 'Ordinamento',
      sortDefault: 'Ordine curato',
      sortAz: 'Alfabetico (A → Z)',
      sortZa: 'Alfabetico (Z → A)',
      showingPrefix: 'Visualizzati',
      showingMiddle: 'su',
      showingSuffix: 'desideri disponibili',
      resetFilters: 'Ripristina filtri',
      myReservationsButton: 'Gestisci prenotazione',
    },
    card: {
      reserveButton: 'Prenota questo regalo ♡',
      reservingButton: 'Prenotazione...',
      buyButton: 'Acquista dal negozio',
      buyAriaPrefix: 'Acquista dal negozio (si apre in una nuova scheda):',
      linkUpdating: 'Link in aggiornamento',
      storePending: 'Negozio in verifica',
      addFavorite: 'Aggiungi ai preferiti',
      removeFavorite: 'Rimuovi dai preferiti',
      imagePendingNote: 'Immagine illustrativa del modello in preparazione',
      receivedLabel: 'Ricevuto ♡',
    },
    reservation: {
      modalTitle: 'Regalo prenotato per 24 ore ♡',
      modalSubtitle:
        'Questo prodotto è stato temporaneamente nascosto agli altri visitatori. Conserva il tuo codice privato per dichiarare l’acquisto o annullare la prenotazione.',
      codeLabel: 'Il tuo codice privato di prenotazione',
      copyCode: 'Copia codice',
      copiedCode: 'Codice copiato',
      expiresLabel: 'Scadenza automatica:',
      expiryRule:
        'Se non dichiari l’acquisto entro 24 ore, il desiderio tornerà automaticamente disponibile per tutti.',
      goToStore: 'Acquista dal negozio',
      noteLabel: 'Dedica breve per Sarah (opzionale, non inserire dati personali)',
      notePlaceholder: 'Es. Buon compleanno Sarah! — Un amico',
      declareBoughtButton: 'Ho acquistato questo regalo ♡',
      cancelReservationButton: 'Annulla prenotazione',
      declaredSuccessTitle: 'Dichiarazione inviata a Sarah ♡',
      declaredSuccessBody:
        'Abbiamo avvisato Sarah nella sua area privata. Verificherà e confermerà il regalo manualmente. Grazie per il pensiero!',
      cancelledSuccess:
        'Prenotazione annullata: il prodotto è tornato disponibile nella wishlist.',
      lookupHeading: 'Hai già un codice prenotazione?',
      lookupPlaceholder: 'Es. SARAH-XXXX-XXXX-XXXX',
      lookupButton: 'Apri prenotazione',
      lookupNotFound:
        'Nessuna prenotazione attiva trovata con questo codice.',
      activeBannerTitle: 'Hai prenotazioni regalo attive sul tuo dispositivo',
      manageButton: 'Gestisci',
      errorAlreadyReserved:
        'Questo desiderio è stato appena prenotato o acquistato da un altro visitatore.',
      errorLimitReached:
        'Puoi mantenere fino a 3 prenotazioni attive contemporaneamente per evitare blocchi abusivi.',
      errorNotSynced:
        'Le prenotazioni condivise saranno attive non appena Sarah sincronizzerà il catalogo dalla sua area privata.',
      errorExpired:
        'Questa prenotazione è scaduta oltre le 24 ore e il prodotto è tornato disponibile.',
      close: 'Chiudi',
    },
    favoritesBar: {
      title: 'I tuoi preferiti salvati nel browser',
      copyList: 'Copia lista',
      copied: 'Lista copiata',
      clearAll: 'Svuota preferiti',
      confirmClear: 'Conferma svuota',
      cancelClear: 'Annulla',
    },
    empty: {
      searchTitle: 'Nessun desiderio trovato',
      searchBody:
        'Prova a modificare le parole chiave di ricerca oppure seleziona un’altra categoria.',
      favoritesTitle: 'Nessun preferito salvato ancora ♡',
      favoritesBody:
        'Tocca il cuore ♡ su qualsiasi scheda per salvare i desideri che stai valutando qui sul tuo dispositivo.',
      backToAll: 'Torna a tutti i desideri',
    },
    deliverySection: {
      heading: 'Come far arrivare un regalo a Sarah ♡',
      point1:
        'I prodotti vengono acquistati direttamente presso i rispettivi negozi esterni.',
      point2:
        'Le modalità di spedizione e consegna dipendono esclusivamente dal venditore scelto.',
      point3:
        'Sarah gestisce privatamente i propri indirizzi di consegna nella sua area riservata.',
      point4:
        'Per gli acquisti Amazon può essere disponibile una Lista Desideri Amazon ufficiale configurata da Sarah.',
      point5:
        'Per gli altri negozi vengono mostrate qui sotto soltanto eventuali istruzioni pubbliche autorizzate da Sarah.',
      amazonCta: 'Apri la Lista Desideri Amazon di Sarah',
      authorizedNoteTitle: 'Istruzioni pubbliche autorizzate da Sarah',
    },
    howItWorks: {
      heading: 'Come funziona',
      lead: 'Esplora i desideri di Sarah, prenota il regalo che preferisci per evitare doppioni e visita il negozio collegato per acquistarlo. Gli acquisti vengono gestiti direttamente dai rispettivi venditori.',
      step1Title: '01. Prenota per 24 ore ♡',
      step1Body:
        'Premi "Prenota questo regalo ♡" per bloccare temporaneamente il prodotto nel database condiviso e ricevere un codice privato.',
      step2Title: '02. Acquista sul sito del negozio',
      step2Body:
        'Apri il negozio verificato in una nuova scheda e completa lì l’acquisto secondo le opzioni del venditore.',
      step3Title: '03. Conferma "Ho acquistato"',
      step3Body:
        'Dopo l’acquisto torna con il tuo codice e premi "Ho acquistato questo regalo ♡" per avvisare Sarah nella sua area privata.',
      privacyNote:
        'Nota sulla privacy: questo sito non raccoglie pagamenti né espone dati di altri visitatori o indirizzi privati di Sarah.',
    },
    footer: {
      tagline: 'Un piccolo mondo di desideri, tutto per Sarah ♡',
      disclaimer:
        'I link esterni rimandano ai rispettivi negozi ufficiali o rivenditori terzi che gestiscono disponibilità, prezzi e spedizioni.',
      localPrivacy:
        'Preferiti e codici personali delle tue prenotazioni sono salvati localmente sul dispositivo.',
      privateAreaButton: 'Area privata Sarah ♡',
    },
    admin: {
      title: 'Area privata Sarah ♡',
      subtitle:
        'Gestisci desideri, link ai negozi, prenotazioni, conferme di acquisto, indirizzi privati e indicazioni pubbliche.',
      close: 'Torna alla wishlist',
      signOut: 'Disconnetti',
      loginTitle: 'Accesso riservato a Sarah',
      loginSubtitle:
        'Accedi con il tuo account autorizzato per gestire la wishlist, le prenotazioni e gli indirizzi privati.',
      googleLogin: 'Accedi con Google',
      emailLabel: 'Email',
      passwordLabel: 'Password',
      signInEmail: 'Accedi con Email e Password',
      registerInvite: 'Primo accesso su invito (crea password)',
      forgotPassword: 'Password dimenticata? Invia reset via email',
      resetSent: 'Email di reimpostazione password inviata.',
      providerNotice:
        'Nota: per usare Email e Password assicurati che il provider Email/Password sia abilitato nella Firebase Console del progetto; l’accesso con Google è già attivo.',
      verifyEmailTitle: 'Verifica la tua email',
      verifyEmailBody:
        'Per proteggere gli indirizzi privati, Firebase richiede la verifica dell’indirizzo email prima di sbloccare l’area privata.',
      resendVerification: 'Invia di nuovo email di verifica',
      verificationSent: 'Email de verifica inviata! Controlla la posta.',
      refreshStatus: 'Ho verificato, aggiorna stato',
      unauthorizedTitle: 'Account non autorizzato',
      unauthorizedBody:
        'Questo account non risulta autorizzato come amministratore di Sarah’s Wishlist ♡.',
      tabs: {
        products: 'Prodotti e Link',
        reservations: 'Prenotazioni e Acquisti',
        addresses: 'Indirizzi privati',
        publicNotes: 'Istruzioni pubbliche',
        security: 'Sicurezza e Password',
      },
      productsPanel: {
        addNew: 'Aggiungi desiderio',
        syncInitial: 'Sincronizza catalogo e nuovi link su database',
        syncedSuccess: 'Catalogo aggiornato su Firestore con successo.',
        editItem: 'Modifica',
        receivedToggle: 'Segna come ricevuto ♡',
        receivedBadge: 'Ricevuto ♡',
        pendingBadge: 'Disponibile',
        deleteConfirm: 'Conferma elimina',
        deleteAction: 'Elimina',
        cancel: 'Annulla',
        save: 'Salva prodotto',
        nameLabel: 'Nome del prodotto',
        brandLabel: 'Marca / Serie',
        categoryLabel: 'Categoria',
        storeLabel: 'Nome negozio (es. Amazon.it, Elgato)',
        urlLabel: 'URL pagina prodotto (https://...)',
        imageLabel: 'URL immagine (https://... o /products/...)',
        imageHint:
          'Lascia vuoto per mostrare il segnaposto grafico elegante con il nome del prodotto.',
        descItLabel: 'Descrizione (Italiano)',
        descEnLabel: 'Descrizione (Inglese)',
        descRoLabel: 'Descrizione (Rumeno)',
        savedMessage: 'Prodotto aggiornato.',
      },
      reservationsPanel: {
        heading: 'Prenotazioni, dichiarazioni di acquisto e regali ricevuti',
        empty:
          'Nessuna prenotazione attiva o acquisto dichiarato al momento. Tutti i desideri sono disponibili.',
        confirmPurchase: 'Conferma acquisto',
        rejectDeclaration: 'Rifiuta e ripristina',
        restoreAvailable: 'Ripristina disponibile',
        markReceived: 'Segna come ricevuto ♡',
        buyerNotePrefix: 'Messaggio del visitatore:',
        expiresAtPrefix: 'Scadenza prenotazione:',
        declaredAtPrefix: 'Dichiarato il:',
      },
      addressesPanel: {
        heading: 'Indirizzi di consegna privati (visibili solo a Sarah)',
        privacyBanner:
          'Questi dati sono protetti da regole server Firestore e non vengono mai esposti ai visitatori, né inclusi nel codice pubblico o inviati automaticamente ai negozi.',
        recipientName: 'Nome destinatario',
        streetAddress: 'Indirizzo di consegna (via, civico, interno)',
        cityAndPostal: 'Città, provincia e CAP',
        country: 'Paese',
        amazonLockerName: 'Nome Amazon Locker o punto di ritiro',
        amazonLockerAddress: 'Indirizzo del punto di ritiro / Locker',
        privateInstructions: 'Istruzioni private aggiuntive per ricevere i regali',
        saveButton: 'Salva indirizzi privati',
        savedMessage: 'Indirizzi privati salvati in modo sicuro.',
      },
      publicPanel: {
        heading: 'Indicazioni pubbliche per i visitatori',
        intro:
          'Scegli esplicitamente cosa mostrare ai visitatori nella sezione "Come far arrivare un regalo a Sarah ♡". Non inserire mai qui il tuo indirizzo di casa privato se non vuoi renderlo pubblico.',
        amazonWishlistUrl: 'Link alla tua Lista Desideri Amazon (opzionale)',
        showAmazonWishlist: 'Mostra ai visitatori il link alla Lista Desideri Amazon',
        publicDeliveryNote:
          'Istruzioni pubbliche non sensibili o contatto privato (opzionale)',
        showPublicDeliveryNote: 'Mostra queste istruzioni ai visitatori',
        hideReceivedFromVisitors:
          'Mantieni nascosti ai visitatori i regali già ricevuti',
        saveButton: 'Salva impostazioni pubbliche',
        savedMessage: 'Impostazioni pubbliche aggiornate.',
      },
      securityPanel: {
        heading: 'Sicurezza account e accesso di Sarah',
        signedInAs: 'Accesso effettuato come:',
        changePasswordHeading: 'Cambia password',
        currentPassword: 'Password attuale',
        newPassword: 'Nuova password (minimo 8 caratteri)',
        confirmPassword: 'Conferma nuova password',
        updatePasswordButton: 'Aggiorna password',
        passwordUpdated: 'Password aggiornata con successo.',
        passwordMismatch: 'Le due nuove password non coincidono.',
        passwordTooShort: 'La nuova password deve avere almeno 8 caratteri.',
        googleAccountNotice:
          'Hai effettuato l’accesso tramite Google: la password viene gestita direttamente dal tuo Account Google.',
        sendResetEmail: 'Invia link di reimpostazione password via email',
        inviteHeading: 'Email personale autorizzata di Sarah',
        inviteHelp:
          'Specifica l’email personale di Sarah per consentirle di accedere autonomamente senza dipendere dal creatore del sito.',
        inviteEmailLabel: 'Email autorizzata per Sarah',
        saveInviteButton: 'Salva email autorizzata',
        inviteSaved: 'Email autorizzata aggiornata.',
      },
    },
  },
  en: {
    meta: {
      title: "Sarah's Wishlist ♡",
      description: 'A little world of wishes, all for Sarah ♡',
    },
    nav: {
      catalog: 'Catalog',
      favorites: 'Favorites ♡',
      howItWorks: 'How it works',
      languageLabel: 'Select language',
    },
    hero: {
      kickerPrefix: 'Curated collection',
      wishlistCountUnit: 'available wishes',
      savedCountUnit: 'favorites',
      subtitle: 'A little world of wishes, all for Sarah ♡',
      intro:
        'From collectible anime figures and plushies to gaming PC hardware and streaming gear: reserve a wish to prevent duplicates and purchase directly from official or trusted stores.',
      exploreCta: 'Explore wishes',
      favoritesCta: 'View favorites ♡',
      imageAlt:
        "Pastel aesthetic composition for Sarah's wishlist featuring anime and desk setup items",
    },
    categories: {
      all: 'All wishes',
      funko: 'Funko Pop! Anime',
      plush: 'Anime Plushies',
      gaming: 'Gaming & PC',
      streaming: 'Streaming & Live',
      accessories: 'Accessories & Gifts',
      favorites: 'Favorites ♡',
    },
    statuses: {
      available: 'Available',
      reserved: 'Reserved',
      purchase_declared: 'Purchase declared',
      confirmed: 'Purchase confirmed',
      received: 'Received',
    },
    controls: {
      searchPlaceholder: 'Search a wish, model, or store...',
      searchLabel: 'Search products in wishlist',
      clearSearch: 'Clear search',
      sortLabel: 'Sort order',
      sortDefault: 'Curated order',
      sortAz: 'Alphabetical (A → Z)',
      sortZa: 'Alphabetical (Z → A)',
      showingPrefix: 'Showing',
      showingMiddle: 'of',
      showingSuffix: 'available wishes',
      resetFilters: 'Reset filters',
      myReservationsButton: 'Manage reservation',
    },
    card: {
      reserveButton: 'Reserve this gift ♡',
      reservingButton: 'Reserving...',
      buyButton: 'Buy from store',
      buyAriaPrefix: 'Buy from store (opens in a new tab):',
      linkUpdating: 'Link updating',
      storePending: 'Store pending verification',
      addFavorite: 'Add to favorites',
      removeFavorite: 'Remove from favorites',
      imagePendingNote: 'Model visual placeholder',
      receivedLabel: 'Received ♡',
    },
    reservation: {
      modalTitle: 'Gift reserved for 24 hours ♡',
      modalSubtitle:
        'This item is temporarily hidden from other visitors. Save your private code to declare your purchase or cancel the reservation.',
      codeLabel: 'Your private reservation code',
      copyCode: 'Copy code',
      copiedCode: 'Code copied',
      expiresLabel: 'Automatic expiration:',
      expiryRule:
        'If you do not declare the purchase within 24 hours, the wish automatically becomes available again.',
      goToStore: 'Buy from store',
      noteLabel: 'Short gift note for Sarah (optional, do not include private data)',
      notePlaceholder: 'e.g. Happy birthday Sarah! — A friend',
      declareBoughtButton: 'I bought this gift ♡',
      cancelReservationButton: 'Cancel reservation',
      declaredSuccessTitle: 'Declaration sent to Sarah ♡',
      declaredSuccessBody:
        'Sarah has been notified in her private area and will verify and confirm the gift manually. Thank you!',
      cancelledSuccess:
        'Reservation cancelled: the wish is available again on the wishlist.',
      lookupHeading: 'Already have a reservation code?',
      lookupPlaceholder: 'e.g. SARAH-XXXX-XXXX-XXXX',
      lookupButton: 'Open reservation',
      lookupNotFound: 'No active reservation found for that code.',
      activeBannerTitle: 'You have active gift reservations on this device',
      manageButton: 'Manage',
      errorAlreadyReserved:
        'This wish was just reserved or purchased by another visitor.',
      errorLimitReached:
        'You can hold up to 3 active reservations at the same time.',
      errorNotSynced:
        'Shared reservations become active as soon as Sarah syncs the catalog from her private area.',
      errorExpired:
        'This reservation expired after 24 hours and the item is available again.',
      close: 'Close',
    },
    favoritesBar: {
      title: 'Your favorites saved in this browser',
      copyList: 'Copy list',
      copied: 'List copied',
      clearAll: 'Clear favorites',
      confirmClear: 'Confirm clear',
      cancelClear: 'Cancel',
    },
    empty: {
      searchTitle: 'No matching wishes found',
      searchBody:
        'Try adjusting your search keywords or switching to another category.',
      favoritesTitle: 'No favorites saved yet ♡',
      favoritesBody:
        'Tap the ♡ heart on any card to keep track of gift ideas locally on your device.',
      backToAll: 'View all wishes',
    },
    deliverySection: {
      heading: 'How to get a gift to Sarah ♡',
      point1:
        'Products are purchased directly from their respective external stores.',
      point2:
        'Shipping and delivery methods depend strictly on the chosen seller.',
      point3:
        'Sarah manages her delivery addresses privately inside her restricted area.',
      point4:
        'For Amazon purchases, an official Amazon Wishlist configured by Sarah may be available below.',
      point5:
        'For other stores, only public instructions explicitly authorized by Sarah are displayed here.',
      amazonCta: "Open Sarah's Amazon Wishlist",
      authorizedNoteTitle: 'Public instructions authorized by Sarah',
    },
    howItWorks: {
      heading: 'How it works',
      lead: "Explore Sarah's wishes, reserve the gift you prefer to prevent duplicates, and visit the linked store to buy it. Orders are handled directly by each respective seller.",
      step1Title: '01. Reserve for 24 hours ♡',
      step1Body:
        'Click "Reserve this gift ♡" to temporarily lock the item in the shared database and receive a private management code.',
      step2Title: '02. Buy on the seller store',
      step2Body:
        'Open the verified store in a new tab and complete your purchase directly with the seller.',
      step3Title: '03. Tap "I bought this gift"',
      step3Body:
        'After buying, enter your code and tap "I bought this gift ♡" so Sarah can verify and confirm it privately.',
      privacyNote:
        "Privacy notice: this site processes no payments and never exposes other visitors' data or Sarah's private addresses.",
    },
    footer: {
      tagline: 'A little world of wishes, all for Sarah ♡',
      disclaimer:
        'External links direct to official brands or third-party retailers responsible for stock, pricing, and fulfillment.',
      localPrivacy:
        'Favorites and your own reservation codes are stored locally on your device.',
      privateAreaButton: "Sarah's private area ♡",
    },
    admin: {
      title: "Sarah's private area ♡",
      subtitle:
        'Manage wishes, store links, reservations, purchase confirmations, private addresses, and public instructions.',
      close: 'Back to wishlist',
      signOut: 'Sign out',
      loginTitle: 'Private sign-in for Sarah',
      loginSubtitle:
        'Sign in with your authorized account to manage the wishlist, reservations, and private delivery details.',
      googleLogin: 'Sign in with Google',
      emailLabel: 'Email',
      passwordLabel: 'Password',
      signInEmail: 'Sign in with Email & Password',
      registerInvite: 'First sign-in via invite (set password)',
      forgotPassword: 'Forgot password? Send reset email',
      resetSent: 'Password reset email sent.',
      providerNotice:
        'Note: Email/Password sign-in requires the Email/Password provider to be enabled in the Firebase Console; Google Sign-In works immediately.',
      verifyEmailTitle: 'Verify your email address',
      verifyEmailBody:
        'To protect private addresses, Firebase requires email verification before unlocking the private dashboard.',
      resendVerification: 'Resend verification email',
      verificationSent: 'Verification email sent! Please check your inbox.',
      refreshStatus: 'I verified, refresh status',
      unauthorizedTitle: 'Account not authorized',
      unauthorizedBody:
        "This account is not authorized as an administrator of Sarah's Wishlist ♡.",
      tabs: {
        products: 'Products & Links',
        reservations: 'Reservations & Purchases',
        addresses: 'Private Addresses',
        publicNotes: 'Public Guidance',
        security: 'Security & Password',
      },
      productsPanel: {
        addNew: 'Add new wish',
        syncInitial: 'Sync catalog & new links to database',
        syncedSuccess: 'Catalog updated in Firestore successfully.',
        editItem: 'Edit',
        receivedToggle: 'Mark as received ♡',
        receivedBadge: 'Received ♡',
        pendingBadge: 'Available',
        deleteConfirm: 'Confirm delete',
        deleteAction: 'Delete',
        cancel: 'Cancel',
        save: 'Save product',
        nameLabel: 'Product name',
        brandLabel: 'Brand / Series',
        categoryLabel: 'Category',
        storeLabel: 'Store name (e.g. Amazon.it, Elgato)',
        urlLabel: 'Product URL (https://...)',
        imageLabel: 'Image URL (https://... or /products/...)',
        imageHint:
          'Leave empty to display the graphic placeholder with the product name.',
        descItLabel: 'Description (Italian)',
        descEnLabel: 'Description (English)',
        descRoLabel: 'Description (Romanian)',
        savedMessage: 'Product saved.',
      },
      reservationsPanel: {
        heading: 'Active reservations, purchase declarations & received gifts',
        empty: 'No active reservations or declared purchases right now.',
        confirmPurchase: 'Confirm purchase',
        rejectDeclaration: 'Reject & restore',
        restoreAvailable: 'Restore available',
        markReceived: 'Mark as received ♡',
        buyerNotePrefix: 'Visitor note:',
        expiresAtPrefix: 'Reservation expires:',
        declaredAtPrefix: 'Declared at:',
      },
      addressesPanel: {
        heading: 'Private delivery addresses (visible only to Sarah)',
        privacyBanner:
          'This data is protected by server-side Firestore rules and is never exposed to visitors, public code, or external stores.',
        recipientName: 'Recipient name',
        streetAddress: 'Delivery address (street, number, apartment)',
        cityAndPostal: 'City and postal code',
        country: 'Country',
        amazonLockerName: 'Amazon Locker or pickup point name',
        amazonLockerAddress: 'Pickup point / Locker address',
        privateInstructions: 'Additional private gift delivery instructions',
        saveButton: 'Save private addresses',
        savedMessage: 'Private addresses saved securely.',
      },
      publicPanel: {
        heading: 'Public instructions for visitors',
        intro:
          'Explicitly choose what visitors may see in the "How to get a gift to Sarah ♡" section. Never enter a private home address here unless you intend to share it publicly.',
        amazonWishlistUrl: 'Link to your Amazon Wishlist (optional)',
        showAmazonWishlist: 'Show Amazon Wishlist link to visitors',
        publicDeliveryNote:
          'Non-sensitive public delivery instructions or private contact method (optional)',
        showPublicDeliveryNote: 'Show these instructions to visitors',
        hideReceivedFromVisitors:
          'Keep gifts marked as Received hidden from visitors',
        saveButton: 'Save public settings',
        savedMessage: 'Public settings updated.',
      },
      securityPanel: {
        heading: "Account security & Sarah's access",
        signedInAs: 'Signed in as:',
        changePasswordHeading: 'Change password',
        currentPassword: 'Current password',
        newPassword: 'New password (minimum 8 characters)',
        confirmPassword: 'Confirm new password',
        updatePasswordButton: 'Update password',
        passwordUpdated: 'Password updated successfully.',
        passwordMismatch: 'The new passwords do not match.',
        passwordTooShort: 'New password must be at least 8 characters.',
        googleAccountNotice:
          'You are signed in with Google: your password is managed through your Google Account.',
        sendResetEmail: 'Send password reset link by email',
        inviteHeading: "Sarah's authorized personal email",
        inviteHelp:
          "Set Sarah's personal email so she can sign in independently without relying on the site creator.",
        inviteEmailLabel: "Sarah's authorized email",
        saveInviteButton: 'Save authorized email',
        inviteSaved: 'Authorized email updated.',
      },
    },
  },
  ro: {
    meta: {
      title: "Sarah's Wishlist ♡",
      description: 'O mică lume de dorințe, toată pentru Sarah ♡',
    },
    nav: {
      catalog: 'Catalog',
      favorites: 'Favorite ♡',
      howItWorks: 'Cum funcționează',
      languageLabel: 'Selectează limba',
    },
    hero: {
      kickerPrefix: 'Colecție selectată',
      wishlistCountUnit: 'dorințe disponibile',
      savedCountUnit: 'favorite',
      subtitle: 'O mică lume de dorințe, toată pentru Sarah ♡',
      intro:
        'De la figurine de colecție și plușuri anime până la componente PC pentru gaming și streaming: rezervă o dorință pentru a evita cadourile duble și cumpără direct din magazine oficiale sau de încredere.',
      exploreCta: 'Explorează dorințele',
      favoritesCta: 'Vezi favorite ♡',
      imageAlt:
        'Compoziție pastelată pentru lista de dorințe a lui Sarah cu accesorii anime și gaming',
    },
    categories: {
      all: 'Toate dorințele',
      funko: 'Funko Pop! Anime',
      plush: 'Plușuri Anime',
      gaming: 'Gaming și PC',
      streaming: 'Streaming și Live',
      accessories: 'Accesorii și Cadouri',
      favorites: 'Favorite ♡',
    },
    statuses: {
      available: 'Disponibil',
      reserved: 'Rezervat',
      purchase_declared: 'Achiziție declarată',
      confirmed: 'Achiziție confirmată',
      received: 'Primit',
    },
    controls: {
      searchPlaceholder: 'Caută o dorință, model sau magazin...',
      searchLabel: 'Caută produse în wishlist',
      clearSearch: 'Șterge căutarea',
      sortLabel: 'Sortare',
      sortDefault: 'Ordine selectată',
      sortAz: 'Alfabetic (A → Z)',
      sortZa: 'Alfabetic (Z → A)',
      showingPrefix: 'Se afișează',
      showingMiddle: 'din',
      showingSuffix: 'dorințe disponibile',
      resetFilters: 'Resetează filtrele',
      myReservationsButton: 'Gestionează rezervarea',
    },
    card: {
      reserveButton: 'Rezervă acest cadou ♡',
      reservingButton: 'Se rezervă...',
      buyButton: 'Cumpără din magazin',
      buyAriaPrefix: 'Cumpără din magazin (se deschide într-o filă nouă):',
      linkUpdating: 'Link în actualizare',
      storePending: 'Magazin în curs de verificare',
      addFavorite: 'Adaugă la favorite',
      removeFavorite: 'Elimină de la favorite',
      imagePendingNote: 'Previzualizare grafică a modelului',
      receivedLabel: 'Primit ♡',
    },
    reservation: {
      modalTitle: 'Cadou rezervat pentru 24 de ore ♡',
      modalSubtitle:
        'Acest produs a fost ascuns temporar pentru ceilalți vizitatori. Păstrează codul privat pentru a declara achiziția sau a anula rezervarea.',
      codeLabel: 'Codul tău privat de rezervare',
      copyCode: 'Copiază codul',
      copiedCode: 'Cod copiat',
      expiresLabel: 'Expirare automată:',
      expiryRule:
        'Dacă nu declari achiziția în 24 de ore, produsul devine automat disponibil din nou.',
      goToStore: 'Cumpără din magazin',
      noteLabel: 'Mesaj scurt pentru Sarah (opțional, nu introduce date personale)',
      notePlaceholder: 'Ex. La mulți ani, Sarah! — Un prieten',
      declareBoughtButton: 'Am cumpărat acest cadou ♡',
      cancelReservationButton: 'Anulează rezervarea',
      declaredSuccessTitle: 'Declarație trimisă către Sarah ♡',
      declaredSuccessBody:
        'Sarah a fost notificată în zona sa privată și va confirma cadoul manual. Mulțumim!',
      cancelledSuccess:
        'Rezervare anulată: produsul este din nou disponibil în wishlist.',
      lookupHeading: 'Ai deja un cod de rezervare?',
      lookupPlaceholder: 'Ex. SARAH-XXXX-XXXX-XXXX',
      lookupButton: 'Deschide rezervarea',
      lookupNotFound: 'Nu a fost găsită nicio rezervare activă pentru acest cod.',
      activeBannerTitle: 'Ai rezervări active salvate pe acest dispozitiv',
      manageButton: 'Gestionează',
      errorAlreadyReserved:
        'Această dorință a fost tocmai rezervată sau cumpărată de alt vizitator.',
      errorLimitReached:
        'Poți avea maximum 3 rezervări active simultan pe acest dispozitiv.',
      errorNotSynced:
        'Rezervările partajate devin active imediat ce Sarah sincronizează catalogul din zona privată.',
      errorExpired:
        'Această rezervare a expirat după 24 de ore și produsul este din nou disponibil.',
      close: 'Închide',
    },
    favoritesBar: {
      title: 'Dorințele tale favorite salvate în browser',
      copyList: 'Copiază lista',
      copied: 'Listă copiată',
      clearAll: 'Golește favoritele',
      confirmClear: 'Confirmă golirea',
      cancelClear: 'Anulează',
    },
    empty: {
      searchTitle: 'Nicio dorință găsită',
      searchBody:
        'Încearcă să modifici cuvintele căutate sau să selectezi o altă categorie.',
      favoritesTitle: 'Nicio dorință favorită salvată încă ♡',
      favoritesBody:
        'Apasă inima ♡ pe orice produs pentru a salva ideile de cadouri local pe dispozitivul tău.',
      backToAll: 'Înapoi la toate dorințele',
    },
    deliverySection: {
      heading: 'Cum să îi trimiți un cadou lui Sarah ♡',
      point1:
        'Produsele sunt cumpărate direct de pe site-urile magazinelor externe respective.',
      point2:
        'Modalitățile de livrare depind exclusiv de vânzătorul ales.',
      point3:
        'Sarah își gestionează privat adresele de livrare în zona sa securizată.',
      point4:
        'Pentru achizițiile Amazon poate fi disponibilă o Listă de Dorințe Amazon oficială configurată de Sarah.',
      point5:
        'Pentru celelalte magazine sunt afișate aici doar instrucțiunile publice autorizate explicit de Sarah.',
      amazonCta: 'Deschide Lista de Dorințe Amazon a lui Sarah',
      authorizedNoteTitle: 'Instrucțiuni publice autorizate de Sarah',
    },
    howItWorks: {
      heading: 'Cum funcționează',
      lead: 'Explorează dorințele lui Sarah, rezervă cadoul preferat pentru a evita dublurile și vizitează magazinul conectat pentru a-l cumpăra. Achizițiile sunt gestionate direct de vânzători.',
      step1Title: '01. Rezervă pentru 24 de ore ♡',
      step1Body:
        'Apasă „Rezervă acest cadou ♡” pentru a bloca temporar produsul în baza de date partajată și a primi un cod privat.',
      step2Title: '02. Cumpără din magazin',
      step2Body:
        'Deschide magazinul verificat într-o filă nouă și finalizează achiziția direct la vânzător.',
      step3Title: '03. Confirmă „Am cumpărat”',
      step3Body:
        'După cumpărare revino cu codul tău și apasă „Am cumpărat acest cadou ♡” pentru a o anunța pe Sarah.',
      privacyNote:
        'Notă de confidențialitate: acest site nu procesează plăți și nu afișează datele altor vizitatori sau adresele private ale lui Sarah.',
    },
    footer: {
      tagline: 'O mică lume de dorințe, toată pentru Sarah ♡',
      disclaimer:
        'Linkurile externe trimit către branduri oficiale sau comercianți terți responsabili pentru stoc, preț și livrare.',
      localPrivacy:
        'Favoritele și codurile tale de rezervare sunt salvate local pe dispozitiv.',
      privateAreaButton: 'Zona privată Sarah ♡',
    },
    admin: {
      title: 'Zona privată Sarah ♡',
      subtitle:
        'Gestionează dorințele, linkurile magazinelor, rezervările, confirmările de achiziție, adresele private și indicațiile publice.',
      close: 'Înapoi la wishlist',
      signOut: 'Deconectare',
      loginTitle: 'Autentificare securizată pentru Sarah',
      loginSubtitle:
        'Conectează-te cu contul tău autorizat pentru a gestiona lista, rezervările și adresele private de livrare.',
      googleLogin: 'Conectare cu Google',
      emailLabel: 'Email',
      passwordLabel: 'Parolă',
      signInEmail: 'Conectare cu Email și Parolă',
      registerInvite: 'Prima conectare prin invitație (creează parolă)',
      forgotPassword: 'Ai uitat parola? Trimite email de resetare',
      resetSent: 'Emailul de resetare a parolei a fost trimis.',
      providerNotice:
        'Notă: pentru autentificarea cu Email și Parolă, providerul Email/Password trebuie activat în Firebase Console; conectarea cu Google este deja activă.',
      verifyEmailTitle: 'Verifică adresa de email',
      verifyEmailBody:
        'Pentru protejarea adreselor private, Firebase solicită verificarea emailului înainte de a debloca zona privată.',
      resendVerification: 'Retrimite emailul de verificare',
      verificationSent: 'Email de verificare trimis! Verifică căsuța poștală.',
      refreshStatus: 'Am verificat, actualizează starea',
      unauthorizedTitle: 'Cont neautorizat',
      unauthorizedBody:
        'Acest cont nu este autorizat ca administrator pentru Sarah’s Wishlist ♡.',
      tabs: {
        products: 'Produse și Linkuri',
        reservations: 'Rezervări și Achiziții',
        addresses: 'Adrese private',
        publicNotes: 'Indicații publice',
        security: 'Securitate și Parolă',
      },
      productsPanel: {
        addNew: 'Adaugă dorință nouă',
        syncInitial: 'Sincronizează catalogul și linkurile noi în baza de date',
        syncedSuccess: 'Catalogul a fost actualizat în Firestore cu succes.',
        editItem: 'Editează',
        receivedToggle: 'Marchează ca primit ♡',
        receivedBadge: 'Primit ♡',
        pendingBadge: 'Disponibil',
        deleteConfirm: 'Confirmă ștergerea',
        deleteAction: 'Șterge',
        cancel: 'Anulează',
        save: 'Salvează produsul',
        nameLabel: 'Numele produsului',
        brandLabel: 'Brand / Serie',
        categoryLabel: 'Categorie',
        storeLabel: 'Nume magazin (ex. Amazon.it, Elgato)',
        urlLabel: 'URL pagină produs (https://...)',
        imageLabel: 'URL imagine (https://... sau /products/...)',
        imageHint:
          'Lasă gol pentru a afișa cadrul grafic elegant cu numele produsului.',
        descItLabel: 'Descriere (Italiană)',
        descEnLabel: 'Descriere (Engleză)',
        descRoLabel: 'Descriere (Română)',
        savedMessage: 'Produs salvat.',
      },
      reservationsPanel: {
        heading: 'Rezervări active, achiziții declarate și cadouri primite',
        empty: 'Nu există rezervări active sau achiziții declarate momentan.',
        confirmPurchase: 'Confirmă achiziția',
        rejectDeclaration: 'Respinge și restaurează',
        restoreAvailable: 'Restaurează disponibil',
        markReceived: 'Marchează ca primit ♡',
        buyerNotePrefix: 'Mesaj vizitator:',
        expiresAtPrefix: 'Expiră la:',
        declaredAtPrefix: 'Declarat la:',
      },
      addressesPanel: {
        heading: 'Adrese private de livrare (vizibile doar pentru Sarah)',
        privacyBanner:
          'Aceste date sunt protejate prin reguli Firestore pe server și nu sunt expuse niciodată vizitatorilor, codului public sau magazinelor externe.',
        recipientName: 'Numele destinatarului',
        streetAddress: 'Adresa de livrare (stradă, număr, apartament)',
        cityAndPostal: 'Oraș și cod poștal',
        country: 'Țară',
        amazonLockerName: 'Nume Amazon Locker sau punct de ridicare',
        amazonLockerAddress: 'Adresa punctului de ridicare / Locker',
        privateInstructions: 'Instrucțiuni private suplimentare pentru livrare',
        saveButton: 'Salvează adresele private',
        savedMessage: 'Adresele private au fost salvate în siguranță.',
      },
      publicPanel: {
        heading: 'Indicații publice pentru vizitatori',
        intro:
          'Alege explicit ce pot vedea vizitatorii în secțiunea „Cum să îi trimiți un cadou lui Sarah ♡”. Nu introduce aici adresa privată de acasă decât dacă vrei să fie publică.',
        amazonWishlistUrl: 'Link către Lista de Dorințe Amazon (opțional)',
        showAmazonWishlist: 'Afișează vizitatorilor linkul către Lista Amazon',
        publicDeliveryNote:
          'Instrucțiuni publice nesensibile sau metodă privată de contact (opțional)',
        showPublicDeliveryNote: 'Afișează aceste instrucțiuni vizitatorilor',
        hideReceivedFromVisitors:
          'Păstrează cadourile marcate ca Primit ascunse pentru vizitatori',
        saveButton: 'Salvează setările publice',
        savedMessage: 'Setările publice au fost actualizate.',
      },
      securityPanel: {
        heading: 'Securitatea contului și accesul lui Sarah',
        signedInAs: 'Conectat ca:',
        changePasswordHeading: 'Schimbă parola',
        currentPassword: 'Parola curentă',
        newPassword: 'Parola nouă (minim 8 caractere)',
        confirmPassword: 'Confirmă parola nouă',
        updatePasswordButton: 'Actualizează parola',
        passwordUpdated: 'Parola a fost actualizată cu succes.',
        passwordMismatch: 'Cele două parole noi nu coincid.',
        passwordTooShort: 'Parola nouă trebuie să aibă cel puțin 8 caractere.',
        googleAccountNotice:
          'Ești conectat cu Google: parola este gestionată direct din Contul tău Google.',
        sendResetEmail: 'Trimite link de resetare a parolei pe email',
        inviteHeading: 'Emailul personal autorizat al lui Sarah',
        inviteHelp:
          'Specifică emailul personal al lui Sarah pentru ca ea să se poată conecta independent fără a depinde de creatorul site-ului.',
        inviteEmailLabel: 'Email autorizat pentru Sarah',
        saveInviteButton: 'Salvează emailul autorizat',
        inviteSaved: 'Emailul autorizat a fost actualizat.',
      },
    },
  },
};
