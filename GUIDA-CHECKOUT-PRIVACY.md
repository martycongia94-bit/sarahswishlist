# Sarah’s Wishlist ♡ — checkout esterno e privacy

## Cosa è stato modificato
- I 38 prodotti, le immagini, gli ID e i servizi Firebase sono conservati.
- I pulsanti di acquisto aprono soltanto URL HTTPS validi, su un sito esterno.
- Il catalogo chiarisce che il pagamento avviene dal venditore e che la riservatezza dell’indirizzo dipende dal fornitore.
- La nota pubblica libera sulla consegna non viene più mostrata, perché potrebbe contenere dati personali. La funzione resta nel pannello e nei dati esistenti, senza cancellazioni.
- Non sono state modificate le regole Firestore, gli account o i documenti del database.

## Prima di pubblicare
1. Verificare tutti i collegamenti ai prodotti: URL HTTPS non significa prodotto corretto o disponibile.
2. Verificare con Amazon o ciascun venditore che una lista regalo protegga davvero l'indirizzo nei confronti dell'acquirente e nelle comunicazioni d'ordine.
3. Non inserire indirizzi di casa in note pubbliche, descrizioni, repository o URL.
4. Fare un backup separato dei dati Firebase: lo ZIP contiene il codice, non il database.
5. Testare prenotazioni, permessi Firebase e accesso amministratore in un ambiente di prova.
6. Un clic sul pulsante non prova che l'acquisto sia stato completato: il venditore deve confermarlo o serve una verifica manuale.

## Limite tecnico
Un checkout Amazon o di altri rivenditori non può essere incorporato liberamente nel sito. Questa versione usa il checkout ospitato dal venditore tramite collegamenti esterni; non incassa denaro e non riceve dati di pagamento.
