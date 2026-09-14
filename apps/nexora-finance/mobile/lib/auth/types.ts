import type { User } from 'firebase/auth';

export type NexoraAuthUser = {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
};

export function mapFirebaseUser(user: User): NexoraAuthUser {
  return {
    uid: user.uid,
    email: user.email,
    displayName: user.displayName,
    photoURL: user.photoURL,
  };
}
