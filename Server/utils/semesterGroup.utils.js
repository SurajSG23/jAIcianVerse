import Chat from "../models/chat.model.js";
import User from "../models/user.model.js";

const MIN_SEMESTER = 1;
const MAX_SEMESTER = 8;

const getSemesterLabel = (semester) => {
  if (semester === 1) return "1st Semester";
  if (semester === 2) return "2nd Semester";
  if (semester === 3) return "3rd Semester";
  return `${semester}th Semester`;
};

export const normalizeSemester = (semester) => {
  if (semester === undefined || semester === null || semester === "") return null;

  const parsed = Number(semester);
  if (!Number.isInteger(parsed)) return null;
  if (parsed < MIN_SEMESTER || parsed > MAX_SEMESTER) return null;

  return parsed;
};

export const ensureSemesterGroupsExist = async () => {
  const operations = [];

  for (let semester = MIN_SEMESTER; semester <= MAX_SEMESTER; semester += 1) {
    operations.push(
      Chat.findOneAndUpdate(
        {
          isSystemGroup: true,
          semesterGroup: semester,
        },
        {
          $setOnInsert: {
            chatName: getSemesterLabel(semester),
            isGroupChat: true,
            isSystemGroup: true,
            semesterGroup: semester,
            users: [],
          },
        },
        {
          upsert: true,
          new: true,
          setDefaultsOnInsert: true,
        }
      )
    );
  }

  await Promise.all(operations);
};

export const syncUserSemesterGroupMembership = async ({
  userId,
  newSemester,
  oldSemester,
}) => {
  const normalizedNewSemester = normalizeSemester(newSemester);
  if (!normalizedNewSemester) return;

  await ensureSemesterGroupsExist();

  const normalizedOldSemester = normalizeSemester(oldSemester);

  if (normalizedOldSemester && normalizedOldSemester !== normalizedNewSemester) {
    await Chat.findOneAndUpdate(
      {
        isSystemGroup: true,
        semesterGroup: normalizedOldSemester,
      },
      {
        $pull: { users: userId },
      }
    );
  } else if (!normalizedOldSemester) {
    // Safety: if old semester is unknown, remove user from any other semester groups first.
    await Chat.updateMany(
      {
        isSystemGroup: true,
        semesterGroup: { $ne: normalizedNewSemester },
      },
      {
        $pull: { users: userId },
      }
    );
  }

  await Chat.findOneAndUpdate(
    {
      isSystemGroup: true,
      semesterGroup: normalizedNewSemester,
    },
    {
      $addToSet: { users: userId },
    }
  );
};

export const syncAllUsersSemesterGroupMembership = async () => {
  await ensureSemesterGroupsExist();

  const users = await User.find({ semester: { $gte: MIN_SEMESTER, $lte: MAX_SEMESTER } })
    .select("_id semester")
    .lean();

  const updates = users.map((user) =>
    syncUserSemesterGroupMembership({
      userId: user._id,
      newSemester: user.semester,
      oldSemester: null,
    })
  );

  await Promise.all(updates);
};
