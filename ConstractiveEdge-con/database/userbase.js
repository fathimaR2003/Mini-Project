var promise = require('promise')
var bcrypt = require('bcryptjs')
var objectId = require('mongodb').ObjectId
var db = require('../connection/connect')
var consts = require('../connection/constants')

module.exports =
{
    Do_Signup_By_Users: (info) => {
        return new promise(async (resolve, reject) => {
            info.password = await bcrypt.hash(info.password, 10)
            db.get().collection(consts.userbase).insertOne(info).then((data) => {
                resolve(data.ops[0]._id)
            })
        })
    },
    Do_Login_By_The_USer: (info) => {
        return new promise(async (resolve, reject) => {
            await db.get().collection(consts.userbase).findOne({ email: info.email }).then(async (data) => {
                var state =
                {
                    user: data,
                    state: true
                }
                if (data) {
                    await bcrypt.compare(info.password, data.password).then((res) => {
                        if (res) {
                            resolve(state)
                        }
                        else {
                            resolve({ state: false })
                        }
                    })
                }
                else {
                    resolve({ state: false })
                }
            })
        })
    },
    FInd_Worker_By_THEUser: (info) => {
        return new promise(async (resolve, reject) => {
            var wrk = await db.get().collection(consts.workers_base).find({ wrktype: info.wrktype, district: info.district }).toArray()
            resolve(wrk);
        })
    },
    Individual_Worker_Info: (Id) => {
        return new promise(async (resolve, reject) => {
            await db.get().collection(consts.workers_base).findOne({ wkid: objectId(Id) }).then((info) => {
                resolve(info)
            })
        })
    },
    User_Send_request_TO_WorKEr: (urid, wkid, type) => {
        return new promise(async (resolve, reject) => {
            var state =
            {
                userId: objectId(urid),
                workersId: objectId(wkid),
                wrktype: type,
                status: false,
                acc: false,
                paymentStatus: false,
                price: ""

            }
            db.get().collection(consts.request_base).insertOne({ ...state }).then((info) => {
                var info =
                {
                    msg: null,
                    wkid: wkid,

                }
                resolve(info)
            })
        })
    },
    Check_Wether_the_User_already_requestedORNot: (urid, wkid) => {
        return new promise(async (resolve, reject) => {
            var data = await db.get().collection(consts.request_base).findOne({ userId: objectId(urid), workersId: objectId(wkid) })
            if (data) {
                var info =
                {
                    msg: "Your already requested wt foe the responce from this worker",
                    wkid: wkid

                }
                resolve(info)
            }
            else {
                var info =
                {
                    msg: null,
                    wkid: wkid

                }
                resolve(info)
            }
        })
    },
    Get_List_OF_user_Requests: (urid) => {
        return new promise(async (resolve, reject) => {
            var list = await db.get().collection(consts.request_base).aggregate([
                {
                    $match: { userId: objectId(urid) }
                },
                {
                    $lookup:
                    {
                        from: consts.workers_base,
                        localField: "workersId",
                        foreignField: "wkid",
                        as: "workers",
                    }
                },
                {
                    $project:
                    {
                        userId: 1,
                        status: 1,
                        workers:
                        {
                            $arrayElemAt: ['$workers', 0]
                        }
                    }
                }
            ]).toArray()
            resolve(list)
        })
    },
    Remove_WorkersUser_Request_By_user: (urid, wkid) => {
        return new promise(async (resolve, reject) => {
            await db.get().collection(consts.request_base).deleteOne({ userId: objectId(urid), workersId: objectId(wkid) }).then((data) => {
                resolve(data)
            })
        })
    },
    User_confirmation_LIsT: (userid) => {
        return new promise(async (resolve, reject) => {
            var list = await db.get().collection(consts.accept_base).aggregate([
                {
                    $match:
                    {
                        userId: objectId(userid)
                    }
                },
                {
                    $lookup:
                    {
                        from: consts.workers_base,
                        localField: "workersId",
                        foreignField: "wkid",
                        as: "workers",
                    }
                },
                {
                    $project:
                    {
                        userId: 1,
                        status: 1,
                        workers:
                        {
                            $arrayElemAt: ['$workers', 0]
                        }
                    }
                }
            ]).toArray()
            resolve(list);
        })
    },
    Remove_Details_From_Accept_BAsE: (userid, wkid) => {
        return new promise(async (resolve, reject) => {
            await db.get().collection(consts.accept_base).deleteOne({ userId: objectId(userid), workersId: objectId(wkid) }).then((data) => {
                resolve(data)
            })
        })
    },
    Remove_Details_From_Request_BAsE: (userid, wkid) => {
        return new promise(async (resolve, reject) => {
            await db.get().collection(consts.request_base).deleteOne({ userId: objectId(userid), workersId: objectId(wkid) }).then((data) => {
                resolve(data)
            })
        })
    },
    Insert_Data_After_User_ConfirMatIOn: (userid, wrkid, type,price) => {
        return new promise((resolve, reject) => {
            var state =
            {
                userId: objectId(userid),
                workersId: objectId(wrkid),
                type: type,
                status: true,
                endstatus: false,
                starting: new Date(),
                ending: null,
                price,
                payment_staus: true
            }
            db.get().collection(consts.userandwkr).insertOne({ ...state }).then((info) => {
                resolve(info)
            })
        })
    },
    Remove_Type_and_User_WIth_WorkersFroM_Request_base: (userid, type) => {
        return new promise(async (resolve, reject) => {
            await db.get().collection(consts.request_base).deleteMany({ userId: objectId(userid), wrktype: type }).then((data) => {
                resolve(data)
            })
        })
    },
    Remove_Type_and_User_WIth_WorkersFroM_Accept: (userid, ttype) => {
        return new promise(async (resolve, reject) => {
            console.log("Deleting records for:", objectId(userid), "with type:", ttype);
            await db.get().collection(consts.accept_base).deleteMany({ userId: objectId(userid), type: ttype }).then((data) => {
                resolve(data)
                console.log(data);
            })
        })
    },
    Get_User_Current_Activites: (userid) => {
        return new promise(async (resolve, reject) => {
            var list = await db.get().collection(consts.userandwkr).aggregate([
                {
                    $match:
                    {
                        userId: objectId(userid),
                        status: true
                    }
                },
                {
                    $lookup:
                    {
                        from: consts.workers_base,
                        localField: "workersId",
                        foreignField: "wkid",
                        as: "workers"
                    }
                },
                {
                    $project:
                    {
                        userId: 1,
                        status: 1,
                        endstatus: 1,
                        starting: 1,
                        ending: 1,
                        workers:
                        {
                            $arrayElemAt: ['$workers', 0]
                        }
                    }
                }
            ]).toArray()
            resolve(list);
        })
    },
    Upload_Feedback_AND_RatinG: (userid, wkid, info) => {
        return new promise(async (resolve, reject) => {
            var infos =
            {
                feedback: info.feedback,
                star: parseInt(info.star),
                userId: objectId(userid)

            }
            var state =
            {
                wkId: objectId(wkid),
                pro: [infos]
            }
            await db.get().collection(consts.feedback_base).findOne({ wkId: objectId(wkid) }).then(async (data) => {
                if (data) {
                    // Check if this user has already submitted feedback for this worker
                    const existingFeedback = data.pro.find(p => p.userId.toString() === userid.toString());

                    if (existingFeedback) {
                        // Update existing feedback instead of creating duplicate
                        await db.get().collection(consts.feedback_base).updateOne(
                            {
                                wkId: objectId(wkid),
                                "pro.userId": objectId(userid)
                            },
                            {
                                $set: {
                                    "pro.$.feedback": info.feedback,
                                    "pro.$.star": parseInt(info.star)
                                }
                            }
                        ).then((data) => {
                            resolve(data)
                        })
                    } else {
                        // Add new feedback entry
                        await db.get().collection(consts.feedback_base).updateOne({ wkId: objectId(wkid) },
                            {
                                $push:
                                {
                                    pro: infos
                                }
                            }).then((data) => {
                                resolve(data)
                            })
                    }
                }
                else {
                    await db.get().collection(consts.feedback_base).insertOne({ ...state }).then((data) => {
                        resolve(data)
                    })
                }
            })
        })

    },
    Get_User_Feedback_AND_ratiNg: (wkid) => {
        return new promise(async (resolve, reject) => {
            var list = await db.get().collection(consts.feedback_base).aggregate([
                {
                    $match:
                    {
                        wkId: objectId(wkid)
                    }
                },
                {
                    $unwind: "$pro"
                },
                {
                    $project:
                    {
                        feedback: '$pro.feedback',
                        star: '$pro.star',
                        userid: '$pro.userId'
                    }
                },
                {
                    $lookup:
                    {
                        from: consts.userbase,
                        localField: "userid",
                        foreignField: "_id",
                        as: 'user'

                    }
                },
                {
                    $project:
                    {
                        feedback: 1,
                        star: 1,
                        user:
                        {
                            $arrayElemAt: ['$user', 0]
                        }
                    }
                }
            ]).toArray()
            resolve(list);
            //console.log(list);
        })
    },
    Find_Total_Rating: (wkid) => {
        return new promise(async (resolve, reject) => {
            var star = await db.get().collection(consts.feedback_base).aggregate([
                {
                    $match:
                    {
                        wkId: objectId(wkid)
                    }
                },
                {
                    $unwind: "$pro"
                },
                {
                    $project:
                    {
                        pro: 1,
                        feedback: '$pro.feedback',
                        star: '$pro.star',
                        userid: '$pro.userId'
                    }
                },
                {
                    $group:
                    {
                        _id: null,
                        total: { $sum: "$star" }
                    }
                }

            ]).toArray()
            resolve(star[0].total);
        })
    },
    Find_Total_Star_coUnt: (wkid) => {
        return new promise(async (resolve, reject) => {
            var num = await db.get().collection(consts.feedback_base).aggregate([
                {
                    $match:
                    {
                        wkId: objectId(wkid)
                    }
                },
                {
                    $project:
                    {
                        len: { $size: "$pro" }
                    }
                }

            ]).toArray()
            resolve(num[0].len);
        })
    },
    Update_Worker_Rating: (wkid, rate) => {
        return new promise(async (resolve, reject) => {
            console.log(rate);
            if (rate == 1) {
                await db.get().collection(consts.workers_base).updateOne({ wkid: objectId(wkid) },
                    {
                        $set:
                        {
                            rating: parseInt(rate),
                            one: true,
                            two: false,
                            three: false,
                            four: false,
                            five: false
                        }
                    }).then((data) => {
                        resolve(data)
                    })
            }
            if (rate == 2) {
                await db.get().collection(consts.workers_base).updateOne({ wkid: objectId(wkid) },
                    {
                        $set:
                        {
                            rating: parseInt(rate),
                            one: false,
                            two: true,
                            three: false,
                            four: false,
                            five: false
                        }
                    }).then((data) => {
                        resolve(data)
                    })
            }
            if (rate == 3) {
                await db.get().collection(consts.workers_base).updateOne({ wkid: objectId(wkid) },
                    {
                        $set:
                        {
                            rating: parseInt(rate),
                            one: false,
                            two: false,
                            three: true,
                            four: false,
                            five: false
                        }
                    }).then((data) => {
                        resolve(data)
                    })
            }
            if (rate == 4) {
                await db.get().collection(consts.workers_base).updateOne({ wkid: objectId(wkid) },
                    {
                        $set:
                        {
                            rating: parseInt(rate),
                            one: false,
                            two: false,
                            three: false,
                            four: true,
                            five: false
                        }
                    }).then((data) => {
                        resolve(data)
                    })
            }
            if (rate == 5) {
                await db.get().collection(consts.workers_base).updateOne({ wkid: objectId(wkid) },
                    {
                        $set:
                        {
                            rating: parseInt(rate),
                            one: false,
                            two: false,
                            three: false,
                            four: false,
                            five: true
                        }
                    }).then((data) => {
                        resolve(data)
                    })
            }

        })
    },
    ChecK_the_Email_aleady_exist_Or_NOt: (mail) => {
        return new promise(async (resolve, reject) => {
            await db.get().collection(consts.userbase).findOne({ email: mail }).then((email) => {
                if (email) {
                    resolve(false)
                }
                else {
                    resolve(true)
                }
            })
        })
    },
    Get_Work_type_forSearch: () => {
        return new promise(async (resolve, reject) => {
            const workers = await db.get().collection(consts.workers_base).find().toArray();
            const wrktype = [... new Set(workers.map((wrk) => wrk.wrktype))]

            resolve({ wrktype, workers })

        })
    },
    Get_User_Current_Activiteshistory: (userid) => {
        return new promise(async (resolve, reject) => {
            var list = await db.get().collection(consts.userandwkr).aggregate([
                {
                    $match:
                    {
                        userId: objectId(userid),
                        status: false
                    }
                },
                {
                    $lookup:
                    {
                        from: consts.workers_base,
                        localField: "workersId",
                        foreignField: "wkid",
                        as: "workers"
                    }
                },
                {
                    $project:
                    {
                        userId: 1,
                        status: 1,
                        endstatus: 1,
                        starting: 1,
                        ending: 1,
                        workers:
                        {
                            $arrayElemAt: ['$workers', 0]
                        }
                    }
                }
            ]).toArray()
            resolve(list);
        })
    },
    Submit_Complaint_About_Worker: (complaintData) => {
        return new promise(async (resolve, reject) => {
            complaintData.userId = objectId(complaintData.userId);
            complaintData.workerId = objectId(complaintData.workerId);
            complaintData.workerType = complaintData.workerType || '';
            complaintData.status = 'pending';
            complaintData.createdAt = new Date();
            complaintData.resolvedAt = null;
            complaintData.adminResponse = null;

            await db.get().collection(consts.complaint_base).insertOne(complaintData);
            resolve();
        })
    },
    Get_User_Complaints: (userId) => {
        return new promise(async (resolve, reject) => {
            var complaints = await db.get().collection(consts.complaint_base).aggregate([
                {
                    $match: {
                        userId: objectId(userId)
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

    // Payment System Functions
    Create_Payment_Record: (paymentData) => {
        return new promise(async (resolve, reject) => {
            paymentData.userId = objectId(paymentData.userId);
            paymentData.workerId = objectId(paymentData.workerId);
            paymentData.paymentDate = new Date();
            paymentData.status = 'completed';

            await db.get().collection(consts.payment_base).insertOne(paymentData).then((data) => {
                resolve(data.ops[0]._id);
            });
        })
    },

    Get_Payment_By_Id: (paymentId) => {
        return new promise(async (resolve, reject) => {
            var payment = await db.get().collection(consts.payment_base).findOne({ _id: objectId(paymentId) });
            resolve(payment);
        })
    },

    Check_Payment_Status: (userId, workerId) => {
        return new promise(async (resolve, reject) => {
            var payment = await db.get().collection(consts.payment_base).findOne({
                userId: objectId(userId),
                workerId: objectId(workerId),
                status: 'completed'
            });
            resolve(payment ? true : false);
        })
    },

    Get_User_Payments: (userId) => {
        return new promise(async (resolve, reject) => {
            var payments = await db.get().collection(consts.payment_base).aggregate([
                {
                    $match: {
                        userId: objectId(userId)
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
    get_Worker_andUser_Information_TO_place_Order: async (workerId) => {
        const worker = await db.get().collection(consts.workers_base).findOne()
    },

    get_WorkerPrice_ForOrder_AND_UserDetais: async (workerId) => {

        console.log("workerId", workerId);


        return await db.get().collection(consts.workers_base).findOne({ wkid: objectId(workerId) })



    }
}