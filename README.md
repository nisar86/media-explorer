# Media Explorer

**Tool for exploring files and folders in a media gallery from the web browser.**   
It allows you to browse content on your local computer or on a PHP server, displaying previews of media files and folders.  
It supports viewing images in a slideshow and playing media files (audio, video) in a queue.      
Developed with HTML, JS and [jQuery](https://jquery.com/), it is designed to work without external dependencies: the entire app is contained in the `media-explorer` folder.

![Gallery Screenshot (Desktop)](https://github.com/nisar86/media-explorer/blob/main/screenshots/fam_desktop_server_gallery_files.jpg?raw=true)

# Setup

1) Save the **media-explorer** app folder with all its contents to a local drive, network drive, or PHP web server.  
2) Start the app by opening the **index.html** file inside the **media-explorer** folder in your web browser (keep all the folder contents).  
3) **Select the file access mode**:

  - **Local and Network Drives**   
  Use the **Select Folder** button to start browsing files on your local drive or local network. 
     
  - **PHP Web Server**  
  Load and display the files from the PHP server folder you have configured.  
  Initial Setup: Specify the web server folder you want to make browsable from the app (it can be the server root or any subfolder). Open the **php/server-list-files.php** file, go to the **Set Directory** section, follow the instructions and set the folder path in the **$directory** variable. For security reasons, **browsing is disabled by default** (`$directory = null;`).

# Features

- **Media player in the browser.**
- **Open multiple instances** of the media player using the (+) button.

- **File access modes**:
  - Disk and Local Network: Browse files on your computer (via the File System Access APIs).
  - PHP Web Server: Browse files stored on the PHP server.
  
- **Disk and Local Network mode options**:   
  - By default, file links point to browser blob memory; this behavior comes from the security policies of the File System Access APIs.       
  - You can access files directly by entering the absolute path of the folder you selected in the dedicated field. 
  If you don’t know the path, you can obtain it from the terminal (or Command Prompt on Windows) by dragging the folder into the terminal window and copying the text path that is generated.   
  
- **PHP Web Server mode options**:   
  - You can access a subfolder by entering its path in the dedicated field.

- **Opens a folder and generates a browsable media gallery**.
- **Displays icons by file type and for folders**.
- **Name filter to display only matching files/folders**.
- **Folder navigation via icons and breadcrumbs**.
- **Displays previews of media files (images/video) and folders**.
- **Displays download links for all files with an active preview**.
- **Customizable limit for the size of files displayed as a preview**.

- **Compatibility for Apple file formats on non-supporting browsers (non-Safari).**    
  - If the browser cannot read HEIF/HEIC files, a conversion process ([heic2any](https://github.com/alexcorvi/heic2any)) is started to make them viewable.
  - You can set the number of simultaneous conversions to speed up the process, if your hardware allows it.  

- **Video previews with play/stop and toggleable audio**.
- **Displays the main media file types using HTML5 features**.
- **Folder previews**: shows the first image found in the folder    
(it must be in a format supported by the browser in use).

- **Counts files and folders in the current view**.
  - Counts the contents of the current folder also by file extension type 
    (activated by interacting with the counter).

- **Gallery or list view modes**.
  - Gallery mode: displays from 1 to 12 items per row.  
  - List mode: displays one item per row with adjustable size from 1 to 12.
  - The size/number of items per row is adjustable via the radio control (bottom right).

- **Responsive navigation**: content adapts to the screen, from desktop to smartphone.
- **Light and dark theme**.
- **English and Italian language support**.

- **Popup Gallery** ([Magnific-Popup](https://github.com/dimsemenov/Magnific-Popup)). 
  - Displays single image files and image slideshows.
  - Customizable slide pause time.
  - Plays video files via HTML5.
  - Plays audio files via HTML5.
  - Playback queue for mixed media (audio/video) or single-type media (audio only or video only).
  - Customizable pause time between one media file and the next.
  - Displays text files and web text files in an iFrame.

- **Hints and notifications system** to support users in the most common usage scenarios.

## Known Issues 

### Issues that may occur in PHP Web Server mode

Some web server configurations may prevent certain media formats (video/audio/images) from working correctly.  
**Server-side compression (Brotli/gzip)** applied to files can cause problems and **should be disabled** in folders that contain media used by the app.

- **`Error: net::ERR_CONTENT_DECODING_FAILED 200`**   
  If this issue occurs, some types of media and/or conversion processes may fail.   
  **This error can occur with some files (e.g. mp4, heic) when Brotli/gzip compression is enabled on the server and the browser tries to access them**. The error happens at the network level, before the script sees anything: the browser receives the response from the server, reads the `Content-Encoding` header (e.g. `br`) and attempts to decompress; if decompression fails, the browser discards the response and returns an error. When this happens, the script never sees the file bytes, only a failed request.

  **Check for the typical signs of this issue:**   
  Open in web browser --> Developer Tools --> Network --> One of the files that fails --> Headers --> Response Headers.  
  Check whether the value of **Content-Encoding** is **br (or gzip)** and whether **Etag ends with -br** (e.g. `"000...-br"`).
  
  **Solution:**  
  Change the configuration of the web server (Apache/Nginx) or the .htaccess rules (if supported by your hosting).   
  Disable server-side compression (Brotli/gzip) for the affected media files by excluding their MIME types from compression (`video/*`, `audio/*`, `image/*`) or by excluding the directory that contains the files that need to be read.   

## Related Links

- Demo: [Media Explorer](https://www.nisar.it/app/media-explorer)
- English Readme: [Readme.md](https://github.com/nisar86/media-explorer/blob/main/README.md)
- Italian Readme: [Leggimi.md](https://github.com/nisar86/media-explorer/blob/main/LEGGIMI.md)

## License

[Media Explorer License](https://github.com/nisar86/media-explorer?tab=MIT-1-ov-file)

## Developer

[Nisar Abed (Nisar.it)](https://www.nisar.it)

## Screenshots

![Screenshot Video Playback (Desktop)](https://github.com/nisar86/media-explorer/blob/main/screenshots/fam_desktop_play_video.jpg?raw=true) 
![Screenshot List View (Desktop)](https://github.com/nisar86/media-explorer/blob/main/screenshots/fam_desktop_list_files.jpg?raw=true) 
![Screenshot HEIF/HEIC Conversion Process (Desktop)](https://github.com/nisar86/media-explorer/blob/main/screenshots/fam_desktop_heif_heic_conversion.jpg?raw=true) 

<div style="display: flex; justify-content: space-between;">
  <img src="https://github.com/nisar86/media-explorer/blob/main/screenshots/fam_mobile_file_counter.jpg?raw=true"  width="32%" alt="Screenshot File Counter (Mobile)">
  <img src="https://github.com/nisar86/media-explorer/blob/main/screenshots/fam_mobile_show_image.jpg?raw=true"    width="32%" alt="Screenshot Image Slideshow (Mobile)">
  <img src="https://github.com/nisar86/media-explorer/blob/main/screenshots/fam_mobile_video_preview.jpg?raw=true" width="32%" alt="Screenshot Video File Preview (Mobile)">
</div>