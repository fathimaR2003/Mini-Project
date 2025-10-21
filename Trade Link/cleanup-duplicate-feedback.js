const { MongoClient, ObjectId } = require('mongodb');

// MongoDB connection URL - UPDATE THIS with your actual connection string
const url = 'mongodb://localhost:27017';
const dbName = 'your_database_name'; // UPDATE THIS with your actual database name

async function cleanupDuplicateFeedback() {
    const client = new MongoClient(url);
    
    try {
        await client.connect();
        console.log('Connected to MongoDB');
        
        const db = client.db(dbName);
        const feedbackCollection = db.collection('FeedBack_Base');
        
        console.log('\n========================================');
        console.log('CLEANING UP DUPLICATE FEEDBACK');
        console.log('========================================\n');
        
        // Get all feedback documents
        const allFeedback = await feedbackCollection.find({}).toArray();
        console.log(`Found ${allFeedback.length} feedback documents\n`);
        
        let totalDuplicatesRemoved = 0;
        
        // Process each feedback document
        for (const feedbackDoc of allFeedback) {
            console.log(`Processing Worker ID: ${feedbackDoc.wkId}`);
            
            // Group feedback by userId
            const feedbackByUser = {};
            
            for (let i = 0; i < feedbackDoc.pro.length; i++) {
                const feedback = feedbackDoc.pro[i];
                const userIdStr = feedback.userId.toString();
                
                if (!feedbackByUser[userIdStr]) {
                    feedbackByUser[userIdStr] = [];
                }
                
                feedbackByUser[userIdStr].push({
                    index: i,
                    feedback: feedback
                });
            }
            
            // Find duplicates
            const uniqueFeedback = [];
            let duplicatesInThisDoc = 0;
            
            for (const userIdStr in feedbackByUser) {
                const userFeedbacks = feedbackByUser[userIdStr];
                
                if (userFeedbacks.length > 1) {
                    console.log(`  Found ${userFeedbacks.length} feedback entries from user ${userIdStr}`);
                    duplicatesInThisDoc += (userFeedbacks.length - 1);
                    
                    // Keep only the last feedback (most recent)
                    uniqueFeedback.push(userFeedbacks[userFeedbacks.length - 1].feedback);
                } else {
                    // No duplicate, keep the feedback
                    uniqueFeedback.push(userFeedbacks[0].feedback);
                }
            }
            
            if (duplicatesInThisDoc > 0) {
                console.log(`  Removing ${duplicatesInThisDoc} duplicate(s)`);
                
                // Update the document with unique feedback only
                await feedbackCollection.updateOne(
                    { _id: feedbackDoc._id },
                    { $set: { pro: uniqueFeedback } }
                );
                
                totalDuplicatesRemoved += duplicatesInThisDoc;
                console.log(`  ✓ Updated successfully`);
            } else {
                console.log(`  No duplicates found`);
            }
            
            console.log('');
        }
        
        console.log('========================================');
        console.log('CLEANUP COMPLETE');
        console.log('========================================');
        console.log(`Total duplicates removed: ${totalDuplicatesRemoved}\n`);
        
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await client.close();
        console.log('Connection closed');
    }
}

// Run the cleanup
cleanupDuplicateFeedback();