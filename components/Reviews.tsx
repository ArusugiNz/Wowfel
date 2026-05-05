import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy, addDoc, serverTimestamp, doc, updateDoc, increment } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { IconStarFilled } from '@tabler/icons-react';
import { toast } from 'react-hot-toast';

interface Review {
  id: string;
  userId: string;
  userName: string;
  rating: number;
  comment: string;
  createdAt: any;
}

export default function Reviews({ productId }: { productId: string }) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const q = query(collection(db, "products", productId, "reviews"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const revs: Review[] = [];
      snapshot.forEach((doc) => {
        revs.push({ id: doc.id, ...doc.data() } as Review);
      });
      setReviews(revs);
    });
    return () => unsubscribe();
  }, [productId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser) {
      toast.error("You must be logged in to leave a review.");
      return;
    }
    if (!comment.trim()) {
      toast.error("Please enter a comment.");
      return;
    }

    setSubmitting(true);
    try {
      await addDoc(collection(db, "products", productId, "reviews"), {
        userId: auth.currentUser.uid,
        userName: auth.currentUser.displayName || auth.currentUser.email?.split('@')[0] || "Anonymous",
        rating,
        comment,
        createdAt: serverTimestamp()
      });

      const productRef = doc(db, "products", productId);
      await updateDoc(productRef, {
        ratingCount: increment(1),
        totalRating: increment(rating)
      });

      setComment("");
      setRating(5);
      toast.success("Review added successfully!");
    } catch (error) {
      console.error("Error adding review", error);
      toast.error("Failed to add review.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mt-12 w-full transition-colors duration-200">
      <h2 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-white mb-6">Customer Reviews</h2>

      <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-neutral-100 dark:border-slate-700 mb-8 transition-colors duration-200">
        <h3 className="font-semibold text-neutral-800 dark:text-neutral-100 mb-4">Write a Review</h3>
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-neutral-600 dark:text-neutral-400">Rating:</span>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  className={`focus:outline-none transition ${star <= rating ? 'text-amber-500' : 'text-neutral-200 dark:text-slate-600 hover:text-amber-300 dark:hover:text-amber-400/50'}`}
                >
                  <IconStarFilled size={24} />
                </button>
              ))}
            </div>
          </div>
          <textarea
            rows={3}
            placeholder="What do you think about this product?"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-900 border border-neutral-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none transition dark:text-white dark:placeholder:text-neutral-500"
          />
          <button
            type="submit"
            disabled={submitting}
            className="self-end bg-neutral-900 dark:bg-blue-600 text-white px-6 py-2 rounded-xl text-sm font-medium hover:bg-neutral-800 dark:hover:bg-blue-700 transition disabled:opacity-50"
          >
            {submitting ? "Submitting..." : "Submit Review"}
          </button>
        </div>
      </form>

      <div className="flex flex-col gap-4">
        {reviews.length === 0 ? (
          <div className="text-center py-8 text-neutral-500 dark:text-neutral-400 bg-neutral-50 dark:bg-slate-800/50 rounded-2xl border border-neutral-100 dark:border-slate-700 border-dashed">
            No reviews yet. Be the first to review this product!
          </div>
        ) : (
          reviews.map((review) => (
            <div key={review.id} className="bg-white dark:bg-slate-800 p-5 rounded-2xl shadow-sm border border-neutral-100 dark:border-slate-700 transition-colors duration-200">
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-neutral-900 dark:text-white">{review.userName}</span>
                <div className="flex gap-1 text-amber-500">
                  {[...Array(5)].map((_, i) => (
                    <IconStarFilled key={i} size={14} className={i < review.rating ? "" : "text-neutral-200 dark:text-slate-600"} />
                  ))}
                </div>
              </div>
              <p className="text-neutral-600 dark:text-neutral-300 text-sm leading-relaxed">{review.comment}</p>
              <span className="text-xs text-neutral-400 dark:text-neutral-500 mt-3 block">
                {review.createdAt ? new Date(review.createdAt.toDate()).toLocaleDateString() : 'Just now'}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
