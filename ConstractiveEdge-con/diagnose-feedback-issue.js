const { MongoClient } = require('mongodb');

// MongoDB connection URL - UPDATE THIS with your actual connection string
const url = 'mongodb://localhost:27017';
const dbName = 'your_database_name'; // UPDATE THIS with your actual database name

async function diagnoseFeedbackIssues() {
    const client = new MongoClient(url);
    
    try {
        await client.connect();
        console.log('Connected to MongoDB');
        
        const db = client.db(dbName);
        const feedbackCollection = db.collection('FeedBack_Base');
        const workersCollection = db.collection('Workers_Base');
        const usersCollection = db.collection('User_Base');
        
        console.log('\n========================================');
        console.log('FEEDBACK DATABASE DIAGNOSIS');
        console.log('========================================\n');
        
        // Get all feedback documents
        const allFeedback = await feedbackCollection.find({}).toArray();
        console.log(`Total feedback documents: ${allFeedback.length}\n`);
        
        // Analyze each feedback document
        for (const feedbackDoc of allFeedback) {
            console.log('----------------------------------------');
            console.log(`Feedback Document ID: ${feedbackDoc._id}`);
            console.log(`Worker ID (wkId): ${feedbackDoc.wkId}`);
            
            // Get worker details
            const worker = await workersCollection.findOne({ wkid: feedbackDoc.wkId.toString() });
            if (worker) {
                console.log(`Worker Name: ${worker.name}`);
                console.log(`Worker Type: ${worker.wrktype}`);
            } else {
                console.log(`⚠️  WARNING: No worker found with wkid: ${feedbackDoc.wkId}`);
            }
            
            console.log(`\nFeedback entries (pro array): ${feedbackDoc.pro.length}`);
            
            // Check for duplicates
            const userIds = feedbackDoc.pro.map(p => p.userId.toString());
            const uniqueUserIds = [...new Set(userIds)];
            
            if (userIds.length !== uniqueUserIds.length) {
                console.log(`❌ DUPLICATE DETECTED: ${userIds.length - uniqueUserIds.length} duplicate feedback entries`);
            }
            
            // List all feedback entries
            for (let i = 0; i < feedbackDoc.pro.length; i++) {
                const feedback = feedbackDoc.pro[i];
                const user = await usersCollection.findOne({ _id: feedback.userId });
                
                console.log(`\n  Feedback #${i + 1}:`);
                console.log(`    User ID: ${feedback.userId}`);
                console.log(`    User Name: ${user ? user.name : 'NOT FOUND'}`);
                console.log(`    User Location: ${user ? user.address : 'NOT FOUND'}`);
                console.log(`    Feedback: ${feedback.feedback}`);
                console.log(`    Rating: ${feedback.star} stars`);
            }
            
            console.log('\n');
        }
        
        console.log('========================================');
        console.log('DIAGNOSIS COMPLETE');
        console.log('========================================\n');
        
        // Summary
        console.log('SUMMARY:');
        console.log(`- Total workers with feedback: ${allFeedback.length}`);
        
        let totalFeedbackEntries = 0;
        let totalDuplicates = 0;
        
        for (const feedbackDoc of allFeedback) {
            totalFeedbackEntries += feedbackDoc.pro.length;
            const userIds = feedbackDoc.pro.map(p => p.userId.toString());
            const uniqueUserIds = [...new Set(userIds)];
            totalDuplicates += (userIds.length - uniqueUserIds.length);
        }
        
        console.log(`- Total feedback entries: ${totalFeedbackEntries}`);
        console.log(`- Total duplicate entries: ${totalDuplicates}`);
        
        if (totalDuplicates > 0) {
            console.log(`\n⚠️  ACTION REQUIRED: Run cleanup script to remove ${totalDuplicates} duplicate entries`);
        }
        
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await client.close();
        console.log('\nConnection closed');
    }
}

// Run the diagnosis
diagnoseFeedbackIssues();