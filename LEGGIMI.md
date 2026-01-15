# Media Explorer

**Strumento per esplorare file e cartelle in una galleria multimediale dal browser web.**   
Permette di navigare contenuti sul computer locale o su un server PHP mostrando le anteprime dei file multimediali e delle cartelle.   
Permette la visualizzazione di immagini in slideshow e la riproduzione di file multimediali (audio,video) in coda.   
Sviluppato con HTML, JS e [jQuery](https://jquery.com/) è progettato per funzionare senza dipendenze esterne, tutta la app è contenuta nella cartella `media-explorer`.

![Screenshot Galleria (Desktop)](https://www.nisar.it/app/media-explorer/screenshots/fam_desktop_server_gallery_files.jpg)

# Setup

1) Salva la cartella della app **media-explorer** con tutto il suo contenuto sul disco locale, disco di rete o server web PHP.  
2) Avvia la app aprendo da browser web il file **index.html** dentro la cartella **media-explorer** (mantieni  tutti i contenuti della cartella).  
3) **Seleziona la modalità di accesso file**:

  - **Disco e Rete Locale**   
  Usa il pulsante **Seleziona Cartella** per iniziare la navigazione dei file su disco o rete locale. 
     
  - **Web Server PHP**   
  Carica e visualizza i file della cartella del server php che è stata impostata.  
  Impostazione Iniziale: Indica la cartella del server web che vuoi rendere navigabile dalla app (può essere la root o una cartella del server). Accedi al file **php/server-list-files.php**, raggiungi la sezione **Set Directory** segui le istruzioni e imposta il percorso alla cartella nella variabile **$directory**. Per ragioni di sicurezza **di default la navigazione è disattivata** ($directory = null;).

# Funzionalità

- **Lettore multimediale via browser.**
- **Apri più istanze** del lettore multimediale con il pulsante (+).

- **Modalità di accesso file**:
  - Disco e Rete Locale: Naviga i file presenti sul computer (tramite le File System Access API).
  - Web Server PHP: Naviga i file presenti sul server PHP.
  
- **Opzioni modalità Disco e Rete Locale**:   
  - Per impostazione predefinita i link ai file puntano alle memorie blob del browser, questo comportamento deriva dalle policy di sicurezza delle File System Access API.     
  - È possibile accedere in modo diretto ai file, inserendo nell'apposito campo il percorso assoluto alla cartella che hai selezionato. 
  Se non conosci il percorso, puoi ottenerlo dal terminale (o dal Prompt dei comandi su Windows), trascinando la cartella nella finestra del terminale e copiando il percorso testuale che viene generato.   
  
- **Opzioni modalità Web Server PHP**:   
  - Puoi accedere a una sottocartella anche inserendo il percorso nell'apposito campo.

- **Apre una cartella e genera una galleria media navigabile**.
- **Visualizza le icone per tipo di file e le cartelle**.
- **Filtro nome per visualizzare solo i file/cartelle corrispondenti**.
- **Navigazione tra le cartelle tramite icone e breadcrumbs**.
- **Visualizza l'anteprima di file media (immagini/video) e cartelle**.
- **Visualizza link di download per tutti i file con anteprima attiva**.
- **Limite personalizzabile alla dimensione dei file visualizzati come anteprima**.

- **Compatibilità formati file Apple su browser non compatibili (non Safari).**    
  - Se il browser non legge i file HEIF/HEIC, per poterli visualizzare viene avviata la conversione ([heic2any](https://github.com/alexcorvi/heic2any)) di questi file.
  - È possibile impostare il numero di conversioni simultanee per velocizzare il processo se l'hardware in uso lo consente.

- **Anteprime video con play/stop e audio attivabile/disattivabile**.
- **Visualizza i principali tipi di file multimediali tramite le funzionalità HTML5**.
- **Anteprima delle cartelle**: visualizza la prima immagine trovata nella cartella    
(deve avere un formato compatibile con il browser in uso).

- **Conteggio di file e cartelle nella vista corrente**.
  - Conteggio dei contenuti della cartella corrente anche per tipo di estensione dei file 
    (si attiva interagendo col contatore).

- **Modalità di visualizzazione a galleria o lista**.
  - Modalità galleria: Visualizza da 1 a 12 elementi per riga. 
  - Modalità Lista: Visualizza un elemento per riga con dimensioni regolabili da 1 a 12.
  - Le dimensioni/quantità per riga, degli elementi sono regolabili dal controllo radio (in basso a destra).

- **Navigazione Responsive**: i contenuti si adattano alla schermo, compatibile dal PC allo smartphone.
- **Tema chiaro e scuro**.
- **Lingua Inglese e Italiano**.

- **Popup Gallery** ([Magnific-Popup](https://github.com/dimsemenov/Magnific-Popup)). 
  - Visualizza file immagini singole e slideshow immagini.
  - Tempo di pausa sulla slide personalizzabile.
  - Riproduci file video tramite HTML5.
  - Riproduci file audio tramite HTML5.
  - Coda di riproduzione per media (audio/video) di tipo misto (audio/video) o stesso tipo (solo audio o solo video).
  - Tempo di pausa tra un media e quello successivo personalizzabile.
  - Visualizza file di testo e file testuali per il web in iFrame.

- **Sistema di suggerimenti e notifiche** per dare supporto agli utenti negli scenari d'uso più frequenti.

## Problemi Noti 

###Problemi che possono presentarsi in modalità Web Server PHP

Alcune configurazioni del web server possono impedire il corretto funzionamento di alcuni formati media (video/audio/immagini).  
**La compressione lato server (Brotli/gzip)** applicata ai file può creare problemi e **andrebbe disattivata** nelle cartelle che contengono i media usati dalla app.

- **`Errore: net::ERR_CONTENT_DECODING_FAILED 200`**   
  Se si verifica questo problema non sarà possibile eseguire alcuni tipi di media e/o eseguire i processi di conversione.   
  **Questo errore può verificarsi con alcuni file (es. mp4, heic) quando la compressione Brotli/gzip è attiva sul server e il browser tenta di accedervi**. L’errore nasce a livello di rete, prima che lo script veda qualcosa, il browser riceve la risposta dal server, legge l’header `Content-Encoding` (es. `br`) e prova a decomprimere; se la decompressione fallisce il browser scarta la risposta e restituisce un errore. Quando questo accade, lo script non vede mai i byte del file, ma soltanto una richiesta fallita.

  **Verifica se sono presenti i segnali tipici del problema:**   
  Apri nel browser web --> Strumenti per sviluppatori --> Network --> Uno dei file che da errore --> Headers --> Response Headers.  
  Controlla se il valore di **Content-Encoding** è **br (o gzip)** e se **Etag contiene -br finale** (es: `"000...-br"`).
  
  **Soluzione:**  
  Modifica la configurazione del server web (Apache/Nginx) o le regole .htaccess (se l'hosting lo permette).   
  Disattivare la compressione (Brotli/gzip) lato server per i file media interessati escludendo i MIME type dalla compressione (`video/*`, `audio/*`, `image/*`) o la directory contenente i file che devono essere letti.   

## Link Correlati

- Demo: [Media Explorer](https://www.nisar.it/app/media-explorer)
- Readme in Inglese: [Readme.md](https://github.com/nisar86/media-explorer/blob/main/README.md)
- Readme in Italiano: [Leggimi.md](https://github.com/nisar86/media-explorer/blob/main/LEGGIMI.md)

## Licenza

[Licenza di Media Explorer](https://github.com/nisar86/media-explorer?tab=MIT-1-ov-file)

## Sviluppatore

[Nisar Abed (Nisar.it)](https://www.nisar.it)

## Screenshot

![Screenshot Riproduzione Video (Desktop)](https://www.nisar.it/app/media-explorer/screenshots/fam_desktop_play_video.jpg) 
![Screenshot Lista (Desktop)](https://www.nisar.it/app/media-explorer/screenshots/fam_desktop_list_files.jpg) 
![Screenshot Processo di conversione HEIF/HEIC (Desktop)](https://www.nisar.it/app/media-explorer/screenshots/fam_desktop_heif_heic_conversion.jpg) 

<div style="display: flex; justify-content: space-between;">
  <img src="https://www.nisar.it/app/media-explorer/screenshots/fam_mobile_file_counter.jpg"  width="32%" alt="Screenshot Contatore File (Mobile)">
  <img src="https://www.nisar.it/app/media-explorer/screenshots/fam_mobile_show_image.jpg"    width="32%" alt="Screenshot Slideshow Immagini (Mobile)">
  <img src="https://www.nisar.it/app/media-explorer/screenshots/fam_mobile_video_preview.jpg" width="32%" alt="Screenshot Anteprima file Video (Mobile)">
</div>