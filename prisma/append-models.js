const fs = require('fs');
const path = require('path');

const schemaPath = path.join(__dirname, 'schema.prisma');

const additions = `

enum TeamRole {
  LEADER
  ADMIN
  MEMBER
}

model MedicalTeam {
  id             String          @id @default(uuid())
  name           String
  description    String?         @db.Text
  imageUrl       String?
  facultyId      String
  universityId   String
  createdAt      DateTime        @default(now())
  updatedAt      DateTime        @updatedAt
  followersCount Int             @default(0)
  faculty        Faculty         @relation(fields: [facultyId], references: [id])
  university     University      @relation(fields: [universityId], references: [id])
  members        TeamMember[]
  followers      TeamFollower[]
  lectures       Lecture[]
  posts          Post[]

  @@index([facultyId])
  @@index([universityId])
}

model TeamMember {
  id        String      @id @default(uuid())
  teamId    String
  userId    String
  role      TeamRole    @default(MEMBER)
  createdAt DateTime    @default(now())
  team      MedicalTeam @relation(fields: [teamId], references: [id], onDelete: Cascade)
  user      User        @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([teamId, userId])
  @@index([userId])
}

model TeamFollower {
  id        String      @id @default(uuid())
  teamId    String
  userId    String
  createdAt DateTime    @default(now())
  team      MedicalTeam @relation(fields: [teamId], references: [id], onDelete: Cascade)
  user      User        @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([teamId, userId])
  @@index([userId])
}

model PlatformMember {
  id          String   @id @default(uuid())
  name        String
  role        String
  description String?  @db.Text
  imageUrl    String?
  sortOrder   Int      @default(0)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
`;

fs.appendFileSync(schemaPath, additions);
console.log('Appended models to schema.prisma');
