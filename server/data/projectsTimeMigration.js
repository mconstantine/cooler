[
  {
    $lookup: {
      from: "tasks",
      localField: "_id",
      foreignField: "project",
      as: "tasks",
    },
  },
  {
    $addFields: {
      startTime: {
        $dateToString: {
          date: {
            $dateTrunc: {
              date: {
                $dateFromString: {
                  dateString: {
                    $cond: {
                      if: {
                        $gt: [
                          {
                            $size: "$tasks",
                          },
                          0,
                        ],
                      },
                      then: {
                        $min: "$tasks.startTime",
                      },
                      else: "$createdAt",
                    },
                  },
                },
              },
              unit: "day",
            },
          },
        },
      },
      endTime: {
        $dateToString: {
          date: {
            $dateTrunc: {
              date: {
                $dateFromString: {
                  dateString: {
                    $cond: {
                      if: {
                        $gt: [
                          {
                            $size: "$tasks",
                          },
                          0,
                        ],
                      },
                      then: {
                        $max: "$tasks.startTime",
                      },
                      else: "$createdAt",
                    },
                  },
                },
              },
              unit: "day",
            },
          },
        },
      },
    },
  },
  {
    $project: {
      tasks: 0,
    },
  },
  {
    $merge: {
      into: "projects",
      whenMatched: "replace",
      whenNotMatched: "discard",
    },
  },
];
