const { MongoClient, ObjectId } = require('mongodb');

// MongoDB connection URL - UPDATE THIS with your actual connection string
const url = 'mongodb://localhost:27017';
const dbName = 'your_database_name'; // UPDATE THIS with your actual database name

// ============================================
// CONFIGURATION - UPDATE THESE VALUES
// ============================================

// The worker ID where the feedback is INCORRECTLY stored (e.g., John the electrician)
const WRONG_WORKER_ID = 'PASTE_JOHN_WORKER_ID_HERE';

// The worker ID where the feedback SHOULD be stored (e.g., the painter)
const CORRECT_WORKER_ID = 'PASTE_PAINTER_WORKER_ID_HERE';

// The user ID who gave the feedback (e.g., Anu)
const USER_ID = 'PASTE_ANU_USER_ID_HERE';

// ============================================

async function fixWrongWorkerFeedback() {
    const client = new MongoClient(url);
    
    try {
        await client.connect();
        console.log('Connected to MongoDB');
        
        const db = client.db(dbName);
        const feedbackCollection = db.collection('FeedBack_Base');
        const workersCollection = db.collection('Workers_Base');
        const usersCollection = db.collection('User_Base');
        
        console.log('\n========================================');
        console.log('FIXING WRONG WORKER FEEDBACK');
        console.log('========================================\n');
        
        // Validate IDs
        if (WRONG_WORKER_ID === 'PASTE_JOHN_WORKER_ID_HERE' || 
            CORRECT_WORKER_ID === 'PASTE_PAINTER_WORKER_ID_HERE' ||
            USER_ID === 'PASTE_ANU_USER_ID_HERE') {
            console.error('❌ ERROR: Please update the configuration section with actual IDs');
            console.log('\nTo find these IDs:');
            console.log('1. Run: node diagnose-feedback-issue.js');
            console.log('2. Look for the worker IDs and user IDs in the output');
            console.log('3. Update the configuration section at the top of this file');
            return;
        }
        
        // Get worker details
        const wrongWorker = await workersCollection.findOne({ wkid: WRONG_WORKER_ID });
        const correctWorker = await workersCollection.findOne({ wkid: CORRECT_WORKER_ID });
        const user = await usersCollection.findOne({ _id: new ObjectId(USER_ID) });
        
        if (!wrongWorker) {
            console.error(`❌ ERROR: Worker not found with ID: ${WRONG_WORKER_ID}`);
            return;
        }
        
        if (!correctWorker) {
            console.error(`❌ ERROR: Worker not found with ID: ${CORRECT_WORKER_ID}`);
            return;
        }
        
        if (!user) {
            console.error(`❌ ERROR: User not found with ID: ${USER_ID}`);
            return;
        }
        
        console.log('Worker Details:');
        console.log(`  Wrong Worker: ${wrongWorker.name} (${wrongWorker.wrktype})`);
        console.log(`  Correct Worker: ${correctWorker.name} (${correctWorker.wrktype})`);
        console.log(`  User: ${user.name}\n`);
        
        // Find the feedback document for the wrong worker
        const wrongFeedbackDoc = await feedbackCollection.findOne({ 
            wkId: new ObjectId(WRONG_WORKER_ID) 
        });
        
        if (!wrongFeedbackDoc) {
            console.log(`No feedback document found for worker: ${wrongWorker.name}`);
            return;
        }
        
        // Find the specific feedback from this user
        const feedbackToMove = wrongFeedbackDoc.pro.find(
            p => p.userId.toString() === USER_ID
        );
        
        if (!feedbackToMove) {
            console.log(`No feedback found from user ${user.name} for worker ${wrongWorker.name}`);
            return;
        }
        
        console.log('Feedback to Move:');
        console.log(`  Feedback: "${feedbackToMove.feedback}"`);
        console.log(`  Rating: ${feedbackToMove.star} stars\n`);
        
        // Confirm before proceeding
        console.log('⚠️  WARNING: This will:');
        console.log(`  1. Remove feedback from ${wrongWorker.name}'s profile`);
        console.log(`  2. Add feedback to ${correctWorker.name}'s profile\n`);
        
        // Remove feedback from wrong worker
        console.log('Step 1: Removing feedback from wrong worker...');
        const removeResult = await feedbackCollection.updateOne(
            { wkId: new ObjectId(WRONG_WORKER_ID) },
            { $pull: { pro: { userId: new ObjectId(USER_ID) } } }
        );
        
        if (removeResult.modifiedCount > 0) {
            console.log('✓ Successfully removed feedback from wrong worker\n');
        } else {
            console.log('⚠️  No changes made (feedback might already be removed)\n');
        }
        
        // Check if correct worker has a feedback document
        let correctFeedbackDoc = await feedbackCollection.findOne({ 
            wkId: new ObjectId(CORRECT_WORKER_ID) 
        });
        
        console.log('Step 2: Adding feedback to correct worker...');
        
        if (correctFeedbackDoc) {
            // Check if user already has feedback for this worker
            const existingFeedback = correctFeedbackDoc.pro.find(
                p => p.userId.toString() === USER_ID
            );
            
            if (existingFeedback) {
                // Update existing feedback
                await feedbackCollection.updateOne(
                    { 
                        wkId: new ObjectId(CORRECT_WORKER_ID),
                        "pro.userId": new ObjectId(USER_ID)
                    },
                    {
                        $set: {
                            "pro.$.feedback": feedbackToMove.feedback,
                            "pro.$.star": feedbackToMove.star
                        }
                    }
                );
                console.log('✓ Updated existing feedback for correct worker\n');
            } else {
                // Add new feedback
                await feedbackCollection.updateOne(
                    { wkId: new ObjectId(CORRECT_WORKER_ID) },
                    { $push: { pro: feedbackToMove } }
                );
                console.log('✓ Added feedback to correct worker\n');
            }
        } else {
            // Create new feedback document
            await feedbackCollection.insertOne({
                wkId: new ObjectId(CORRECT_WORKER_ID),
                pro: [feedbackToMove]
            });
            console.log('✓ Created new feedback document for correct worker\n');
        }
        
        console.log('========================================');
        console.log('FIX COMPLETE');
        console.log('========================================');
        console.log(`Feedback from ${user.name} has been moved from ${wrongWorker.name} to ${correctWorker.name}\n`);
        
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await client.close();
        console.log('Connection closed');
    }
}

// Run the fix
fixWrongWorkerFeedback();