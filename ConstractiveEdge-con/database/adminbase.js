var promise = require('promise')
var bcrypt = require('bcryptjs')
var objectId = require('mongodb').ObjectId
var db = require('../connection/connect')
var consts = require('../connection/constants')

module.exports =
{
    Show_Worker_Registration_Request: () => {
        return new promise(async (resolve, reject) => {
            var list = await db.get().collection(consts.workers_temp).find().toArray()
            resolve(list)
        })
    },
    Accept_Worker_Registration: (info) => {
        return new promise(async (resolve, reject) => {
            info.wkid = objectId(info.wkid)
            info.wkingstatus = false
            info.five = true
            info.four = false
            info.three = false
            info.two = false
            info.one = false
            db.get().collection(consts.workers_base).insertOne(info).then((data) => {
                resolve(data.ops[0]._id)
            })
        })
    },
    Remove_Worker_Registration: (wkid) => {
        return new promise(async (resolve, reject) => {
            await db.get().collection(consts.workers_temp).deleteOne({ _id: objectId(wkid) }).then((info) => {
                resolve(info)
            })
        })
    },
    Do_admIn_LogIn: (info) => {
        return new promise(async (resolve, reject) => {
            await db.get().collection(consts.admin_base).findOne({ name: info.name, password: info.password }).then((infos) => {
                if (infos) {
                    resolve(infos)
                }
                else {
                    resolve(false)
                }
            })
        })
    },
    Get_Workers_Details: () => {
        return new promise(async (resolve, reject) => {
            var list = await db.get().collection(consts.workers_base).find().toArray()
            resolve(list)
        })
    },
    Remove_Worker: (id) => {
        return new promise(async (resolve, reject) => {
            await db.get().collection(consts.workers_base).deleteOne({ wkid: objectId(id) }).then((data) => {
                resolve()
            })
        })
    },
    Get_Users_Details: () => {
        return new promise(async (resolve, reject) => {
            var list = await db.get().collection(consts.userbase).find().toArray()
            resolve(list)
        })
    },
    Remove_Users: (id) => {
        return new promise(async (resolve, reject) => {
            await db.get().collection(consts.userbase).deleteOne({ _id: objectId(id) }).then((data) => {
                resolve()
            })
        })
    },
    Get_all_activites: () => {
        return new promise(async (resolve, reject) => {
            var act = await db.get().collection(consts.userandwkr).aggregate([
                {
                    $lookup:
                    {
                        from: consts.userbase,
                        localField: "userId",
                        foreignField: "_id",
                        as: "user"
                    }
                },
                {
                    $project:
                    {
                        workersId: 1,
                        type: 1,
                        status: 1,
                        endstatus: 1,
                        starting: 1,
                        ending: 1,
                        user:
                        {
                            $arrayElemAt: ['$user', 0]
                        }
                    }
                },
                {
                    $lookup:
                    {
                        from: consts.workers_base,
                        localField: "workersId",
                        foreignField: "wkid",
                        as: "worker"
                    }
                },
                {
                    $project:
                    {
                        type: 1,
                        status: 1,
                        endstatus: 1,
                        starting: 1,
                        ending: 1,
                        user: 1,
                        worker:
                        {
                            $arrayElemAt: ['$worker', 0]
                        }
                    }
                }
            ]).toArray()
            resolve(act)
        })
    },
    Find_howmant_users_are_on_mt_website: () => {
        return new promise(async (resolve, reject) => {
            const users = await db.get().collection(consts.userbase).find().toArray();
            resolve(users.length);

        })
    },
    Find_howmant_worker_are_on_mt_website: () => {
        return new promise(async (resolve, reject) => {
            const worker = await db.get().collection(consts.workers_base).find().toArray();
            resolve(worker.length);

        })
    },
    Find_howmant_activity_are_on_mt_website: () => {
        return new promise(async (resolve, reject) => {
            const action = await db.get().collection(consts.userandwkr).find().toArray();
            resolve(action.length);
        })
    },
    Get_all_users_For_admin_dashbord: () => {
        return new promise(async (resolve, reject) => {
            const users = await db.get().collection(consts.userbase).find().toArray();
            resolve(users);

        })
    },
    Get_all_worker_For_admin_dashbord: () => {
        return new promise(async (resolve, reject) => {
            const users = await db.get().collection(consts.workers_base).find().toArray();
            resolve(users);

        })
    },
    Get_All_Complaints: () => {
        return new promise(async (resolve, reject) => {
            var complaints = await db.get().collection(consts.complaint_base).aggregate([
                {
                    $lookup: {
                        from: consts.userbase,
                        localField: "userId",
                        foreignField: "_id",
                        as: "userDetails"
                    }
                },
                {
                    $lookup: {
                        from: consts.workers_base,
                        localField: "workerId",
                        foreignField: "wkid",
                        as: "workerDetails"
                    }
                },
                {
                    $project: {
                        subject: 1,
                        complaint: 1,
                        workerType: 1,
                        workDate: 1,
                        status: 1,
                        createdAt: 1,
                        resolvedAt: 1,
                        adminResponse: 1,
                        userDetails: {
                            $arrayElemAt: ['$userDetails', 0]
                        },
                        workerDetails: {
                            $arrayElemAt: ['$workerDetails', 0]
                        }
                    }
                },
                {
                    $sort: { createdAt: -1 }
                }
            ]).toArray();
            resolve(complaints);
        })
    },
    Update_Complaint_Status: (complaintId, status, adminResponse) => {
        return new promise(async (resolve, reject) => {
            let updateData = {
                status: status,
                adminResponse: adminResponse
            };
            
            if (status === 'resolved') {
                updateData.resolvedAt = new Date();
            }
            
            await db.get().collection(consts.complaint_base).updateOne(
                { _id: objectId(complaintId) },
                { $set: updateData }
            );
            resolve();
        })
    },
    Delete_Complaint: (complaintId) => {
        return new promise(async (resolve, reject) => {
            await db.get().collection(consts.complaint_base).deleteOne(
                { _id: objectId(complaintId) }
            );
            resolve();
        })
    },
    
    // Work Pricing Functions
    Get_All_Work_Prices: () => {
        return new promise(async (resolve, reject) => {
            var prices = await db.get().collection(consts.work_prices).find().toArray();
            resolve(prices);
        })
    },
    
    Get_Work_Price_By_Type: (workType) => {
        return new promise(async (resolve, reject) => {
            var price = await db.get().collection(consts.work_prices).findOne({ workType: workType });
            resolve(price);
        })
    },
    
    Add_Work_Price: (priceData) => {
        return new promise(async (resolve, reject) => {
            // Check if work type already exists
            const existing = await db.get().collection(consts.work_prices).findOne({ workType: priceData.workType });
            if (existing) {
                reject({ error: 'Work type already exists' });
            } else {
                await db.get().collection(consts.work_prices).insertOne(priceData);
                resolve();
            }
        })
    },
    
    Update_Work_Price: (workType, priceData) => {
        return new promise(async (resolve, reject) => {
            await db.get().collection(consts.work_prices).updateOne(
                { workType: workType },
                { $set: priceData }
            );
            resolve();
        })
    },
    
    Delete_Work_Price: (workType) => {
        return new promise(async (resolve, reject) => {
            await db.get().collection(consts.work_prices).deleteOne({ workType: workType });
            resolve();
        })
    },

    // Payment History Functions for Admin
    Get_All_Payments: () => {
        return new promise(async (resolve, reject) => {
            var payments = await db.get().collection(consts.payment_base).aggregate([
                {
                    $lookup: {
                        from: consts.userbase,
                        localField: "userId",
                        foreignField: "_id",
                        as: "userDetails"
                    }
                },
                {
                    $lookup: {
                        from: consts.workers_base,
                        localField: "workerId",
                        foreignField: "wkid",
                        as: "workerDetails"
                    }
                },
                {
                    $project: {
                        amount: 1,
                        paymentMethod: 1,
                        invoiceNumber: 1,
                        paymentDate: 1,
                        status: 1,
                        workType: 1,
                        userDetails: {
                            $arrayElemAt: ['$userDetails', 0]
                        },
                        workerDetails: {
                            $arrayElemAt: ['$workerDetails', 0]
                        }
                    }
                },
                {
                    $sort: { paymentDate: -1 }
                }
            ]).toArray();
            resolve(payments);
        })
    },

    // Delete all activities
    Delete_All_Activities: () => {
        return new promise(async (resolve, reject) => {
            try {
                await db.get().collection(consts.userandwkr).deleteMany({});
                resolve();
            } catch (error) {
                reject(error);
            }
        })
    }
}