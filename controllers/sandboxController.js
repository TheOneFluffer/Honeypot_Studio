//---------------------------VIRUSTOTAL----------------------------\\
const mongoose = require('mongoose');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const FormData = require('form-data');
const { VIRUSTOTAL_API_KEY, VIRUSTOTAL_API_URL} = require('../config/sandboxConfig');

// Function to fetch logs from an existing collection
const getLogsFromCollection = async (collectionName) => {
    try {
        const LogModel = mongoose.connection.collection(collectionName);
        const logs = await LogModel.find({}).toArray();
        return logs;
    } catch (error) {
        console.error(`Error fetching logs from ${collectionName}:`, error.message);
        throw new Error(`Failed to fetch logs from ${collectionName}`);
    }
};

// Function to download a file from the honeypot to the local system
const downloadFileFromHoneypot = async (honeypotName, fileName) => {
    const remoteFilePath = `/opt/dionaea/var/lib/dionaea/ftp/root/${fileName}`;
    const localFilePath = `/home/user/Downloads/${fileName}`;
    const logFilePath = path.join(__dirname, '../downloaded_exe_files.txt'); // Log file path
    
    return new Promise((resolve, reject) => {
        const command = `sudo docker cp ${honeypotName}:${remoteFilePath} ${localFilePath}`;
        exec(command, (error, stdout, stderr) => {
            if (error) {
                console.error('Error downloading file from honeypot:', stderr || error.message);
                reject(new Error('Failed to download file from honeypot.'));
            } else {
                console.log('File downloaded successfully:', stdout);

                // Append the file name to the log file
                fs.appendFile(logFilePath, `${fileName}\n`, (err) => {
                    if (err) {
                        console.error(`Error writing to ${logFilePath}:`, err.message);
                    } else {
                        console.log(`File name logged: ${fileName}`);
                    }
                });
                
                resolve(localFilePath);
            }
        });
    });
};

// Function to send a file to VirusTotal
const sendFileToVirusTotal = async (filePath) => {
    try {
        const form = new FormData();
        form.append('file', fs.createReadStream(filePath));

        const response = await axios.post(VIRUSTOTAL_API_URL, form, {
            headers: {
                ...form.getHeaders(),
                'x-apikey': VIRUSTOTAL_API_KEY,
            },
        });

        console.log('File sent to VirusTotal successfully:', response.data);
        return response.data;
    } catch (error) {
        console.error('Error sending file to VirusTotal:', error.message);
        throw error;
    }
};

// Function to fetch analysis results from VirusTotal
const fetchAnalysisResult = async (analysisId) => {
    const url = `https://www.virustotal.com/api/v3/analyses/${analysisId}`;
    let status = null;
    let attempts = 0;
    const maxAttempts = 20; // Number of retries
    const delay = 10000; // Delay in milliseconds between retries

    while (attempts < maxAttempts) {
        const response = await axios.get(url, {
            headers: { 'x-apikey': VIRUSTOTAL_API_KEY },
        });

        const data = response.data;
        status = data?.data?.attributes?.status;

        if (status === 'completed') {
            return data; // Return the result once completed
        }

        console.log(`Analysis status: ${status}. Retrying in ${delay / 1000} seconds...`);
        attempts += 1;
        await new Promise((resolve) => setTimeout(resolve, delay));
    }

    throw new Error('Analysis did not complete within the allowed time.');
};

// Function to fetch detailed analysis using file hash
const fetchFileDetails = async (fileHash) => {
    try {
        const url = `https://www.virustotal.com/api/v3/files/${fileHash}`;
        const response = await axios.get(url, {
            headers: { 'x-apikey': VIRUSTOTAL_API_KEY },
        });
        console.log(`Detailed file information retrieved for hash: ${fileHash}`);
        return response.data;
    } catch (error) {
        console.error(`Error fetching file details for hash ${fileHash}:`, error.message);
        throw error;
    }
};

// Function to delete a file from the local system
const deleteFile = async (filePath, fileName) => {
    try {
        fs.unlinkSync(filePath);
        console.log(`Deleted file: ${fileName}`);
    } catch (error) {
        console.error(`Error deleting file ${fileName}:`, error.message);
    }
};


// Controller to retrieve logs, check for `.exe` files, download them, and send to VirusTotal
const processLogsForExeFiles = async (req, res) => {
    const { honeypotName } = req.params;
    if (!honeypotName) {
        return res.status(400).json({ message: 'Honeypot name is required.' });
    }

    try {
        const collectionName = `logs_${honeypotName}`;
        console.log(`Fetching logs from collection: ${collectionName}`);
        const logs = await getLogsFromCollection(collectionName);

        if (!logs || logs.length === 0) {
            return res.status(404).json({ message: 'No logs found in the specified collection.' });
        }

        const results = [];
        const analyzedFiles = new Set(); // Track analyzed files

        for (const log of logs) {
            // Check if the log indicates an `.exe` file upload
            const match = log.log.match(/STOR (\S+\.exe)/);
            if (match) {
                const fileName = match[1];

                // Skip if the file has already been analyzed
                if (analyzedFiles.has(fileName)) {
                    console.log(`Skipping duplicate file: ${fileName}`);
                    continue;
                }

                console.log(`Found .exe file in logs: ${fileName}`);

                // Download the file from the honeypot
                const localFilePath = await downloadFileFromHoneypot(honeypotName, fileName);

                // Send the file to VirusTotal
                const uploadResponse = await sendFileToVirusTotal(localFilePath);

                // Fetch analysis result from VirusTotal
                const analysisId = uploadResponse.data.id;
                const analysisResult = await fetchAnalysisResult(analysisId);


                // Fetch detailed file information
                const fileHash = analysisResult.meta?.file_info?.sha256;
                if (!fileHash) {
                    console.log(`No hash found for file: ${fileName}`);
                    continue;
                }

                console.log(`Extracted hash: ${fileHash}`);

                const fileDetails = await fetchFileDetails(fileHash);

                // Store the results
                results.push({ fileName, uploadResponse, analysisResult, fileDetails});

                // Mark the file as analyzed
                analyzedFiles.add(fileName);

                await deleteFile(localFilePath);

            }
        }

        if (results.length === 0) {
            return res.status(404).json({ message: 'No .exe files found in the logs.' });
        }

        console.log(`Analysis Complete!`);

        res.status(200).json({
            message: 'Exe files processed and sent to VirusTotal successfully.',
            results,
        });
    } catch (error) {
        console.error('Error processing logs for exe files:', error.message);
        res.status(500).json({ message: 'Failed to process logs for exe files.', error: error.message });
    }
};


module.exports = { processLogsForExeFiles };


//---------------------------VIRUSTOTAL----------------------------\\
