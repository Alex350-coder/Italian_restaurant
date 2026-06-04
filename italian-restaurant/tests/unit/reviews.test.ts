import { describe, it, expect, vi, beforeEach } from "vitest";

interface Review {
  id: string;
  user_id: string;
  menu_item_id: string;
  rating: number;
  comment: string;
  created_at: Date;
  updated_at: Date;
}

interface CreateReviewInput {
  user_id: string;
  menu_item_id: string;
  rating: number;
  comment: string;
}

class ReviewModel {
  private reviews: Review[] = [];

  async create(input: CreateReviewInput): Promise<Review> {
    if (input.rating < 1 || input.rating > 5) {
      throw new Error("Rating must be between 1 and 5");
    }

    if (!input.comment || input.comment.trim().length === 0) {
      throw new Error("Comment is required");
    }

    if (input.comment.length > 1000) {
      throw new Error("Comment must be 1000 characters or less");
    }

    const existingReview = this.reviews.find(
      (r) => r.user_id === input.user_id && r.menu_item_id === input.menu_item_id
    );
    if (existingReview) {
      throw new Error("You have already reviewed this item");
    }

    const review: Review = {
      id: `rev-${Date.now()}`,
      user_id: input.user_id,
      menu_item_id: input.menu_item_id,
      rating: input.rating,
      comment: input.comment.trim(),
      created_at: new Date(),
      updated_at: new Date(),
    };

    this.reviews.push(review);
    return review;
  }

  async findByMenuItem(menuItemId: string): Promise<Review[]> {
    return this.reviews.filter((r) => r.menu_item_id === menuItemId);
  }

  async findByUserId(userId: string): Promise<Review[]> {
    return this.reviews.filter((r) => r.user_id === userId);
  }

  async findById(reviewId: string): Promise<Review | null> {
    return this.reviews.find((r) => r.id === reviewId) || null;
  }

  async update(reviewId: string, userId: string, updates: { rating?: number; comment?: string }): Promise<Review | null> {
    const reviewIndex = this.reviews.findIndex((r) => r.id === reviewId);
    if (reviewIndex === -1) return null;

    const review = this.reviews[reviewIndex];
    if (review.user_id !== userId) {
      throw new Error("Not authorized to update this review");
    }

    if (updates.rating !== undefined && (updates.rating < 1 || updates.rating > 5)) {
      throw new Error("Rating must be between 1 and 5");
    }

    if (updates.comment !== undefined) {
      if (updates.comment.trim().length === 0) {
        throw new Error("Comment cannot be empty");
      }
      if (updates.comment.length > 1000) {
        throw new Error("Comment must be 1000 characters or less");
      }
    }

    const updated = {
      ...review,
      ...updates,
      comment: updates.comment ? updates.comment.trim() : review.comment,
      updated_at: new Date(),
    };

    this.reviews[reviewIndex] = updated;
    return updated;
  }

  async delete(reviewId: string, userId: string, isAdmin: boolean = false): Promise<boolean> {
    const reviewIndex = this.reviews.findIndex((r) => r.id === reviewId);
    if (reviewIndex === -1) return false;

    const review = this.reviews[reviewIndex];
    if (!isAdmin && review.user_id !== userId) {
      throw new Error("Not authorized to delete this review");
    }

    this.reviews.splice(reviewIndex, 1);
    return true;
  }
}

describe("ReviewModel", () => {
  let reviewModel: ReviewModel;

  beforeEach(() => {
    vi.clearAllMocks();
    reviewModel = new ReviewModel();
  });

  describe("create", () => {
    it("should create a review with valid data", async () => {
      const review = await reviewModel.create({
        user_id: "user-1",
        menu_item_id: "menu-1",
        rating: 5,
        comment: "Amazing pizza!",
      });

      expect(review.id).toBeDefined();
      expect(review.user_id).toBe("user-1");
      expect(review.menu_item_id).toBe("menu-1");
      expect(review.rating).toBe(5);
      expect(review.comment).toBe("Amazing pizza!");
      expect(review.created_at).toBeInstanceOf(Date);
    });

    it("should trim whitespace from comments", async () => {
      const review = await reviewModel.create({
        user_id: "user-1",
        menu_item_id: "menu-1",
        rating: 4,
        comment: "  Good pasta!  ",
      });

      expect(review.comment).toBe("Good pasta!");
    });

    it("should throw when rating is below 1", async () => {
      await expect(
        reviewModel.create({
          user_id: "user-1",
          menu_item_id: "menu-1",
          rating: 0,
          comment: "Bad",
        })
      ).rejects.toThrow("Rating must be between 1 and 5");
    });

    it("should throw when rating is above 5", async () => {
      await expect(
        reviewModel.create({
          user_id: "user-1",
          menu_item_id: "menu-1",
          rating: 6,
          comment: "Too good!",
        })
      ).rejects.toThrow("Rating must be between 1 and 5");
    });

    it("should accept all valid ratings (1-5)", async () => {
      for (let rating = 1; rating <= 5; rating++) {
        const review = await reviewModel.create({
          user_id: "user-1",
          menu_item_id: `menu-${rating}`,
          rating,
          comment: `Rating ${rating}`,
        });
        expect(review.rating).toBe(rating);
      }
    });

    it("should throw when comment is empty", async () => {
      await expect(
        reviewModel.create({
          user_id: "user-1",
          menu_item_id: "menu-1",
          rating: 3,
          comment: "",
        })
      ).rejects.toThrow("Comment is required");
    });

    it("should throw when comment is only whitespace", async () => {
      await expect(
        reviewModel.create({
          user_id: "user-1",
          menu_item_id: "menu-1",
          rating: 3,
          comment: "   ",
        })
      ).rejects.toThrow("Comment is required");
    });

    it("should prevent duplicate reviews from same user for same item", async () => {
      await reviewModel.create({
        user_id: "user-1",
        menu_item_id: "menu-1",
        rating: 5,
        comment: "Great!",
      });

      await expect(
        reviewModel.create({
          user_id: "user-1",
          menu_item_id: "menu-1",
          rating: 4,
          comment: "Also good",
        })
      ).rejects.toThrow("You have already reviewed this item");
    });

    it("should allow same user to review different items", async () => {
      await reviewModel.create({
        user_id: "user-1",
        menu_item_id: "menu-1",
        rating: 5,
        comment: "Great pizza!",
      });

      const review2 = await reviewModel.create({
        user_id: "user-1",
        menu_item_id: "menu-2",
        rating: 4,
        comment: "Good pasta!",
      });

      expect(review2.menu_item_id).toBe("menu-2");
    });

    it("should allow different users to review same item", async () => {
      await reviewModel.create({
        user_id: "user-1",
        menu_item_id: "menu-1",
        rating: 5,
        comment: "Excellent!",
      });

      const review2 = await reviewModel.create({
        user_id: "user-2",
        menu_item_id: "menu-1",
        rating: 4,
        comment: "Very good!",
      });

      expect(review2.user_id).toBe("user-2");
    });
  });

  describe("findByMenuItem", () => {
    it("should return all reviews for a menu item", async () => {
      await reviewModel.create({ user_id: "user-1", menu_item_id: "menu-1", rating: 5, comment: "Great!" });
      await reviewModel.create({ user_id: "user-2", menu_item_id: "menu-1", rating: 4, comment: "Good!" });
      await reviewModel.create({ user_id: "user-3", menu_item_id: "menu-2", rating: 3, comment: "Ok" });

      const reviews = await reviewModel.findByMenuItem("menu-1");

      expect(reviews).toHaveLength(2);
      expect(reviews.every((r) => r.menu_item_id === "menu-1")).toBe(true);
    });

    it("should return empty array when no reviews exist for item", async () => {
      const reviews = await reviewModel.findByMenuItem("nonexistent-menu");

      expect(reviews).toEqual([]);
    });
  });

  describe("findByUserId", () => {
    it("should return all reviews by a user", async () => {
      await reviewModel.create({ user_id: "user-1", menu_item_id: "menu-1", rating: 5, comment: "Pizza!" });
      await reviewModel.create({ user_id: "user-1", menu_item_id: "menu-2", rating: 4, comment: "Pasta!" });
      await reviewModel.create({ user_id: "user-2", menu_item_id: "menu-1", rating: 3, comment: "Other user" });

      const reviews = await reviewModel.findByUserId("user-1");

      expect(reviews).toHaveLength(2);
      expect(reviews.every((r) => r.user_id === "user-1")).toBe(true);
    });

    it("should return empty array when user has no reviews", async () => {
      const reviews = await reviewModel.findByUserId("user-no-reviews");

      expect(reviews).toEqual([]);
    });
  });

  describe("update", () => {
    it("should update review when user is the owner", async () => {
      const review = await reviewModel.create({
        user_id: "user-1",
        menu_item_id: "menu-1",
        rating: 4,
        comment: "Good",
      });

      const updated = await reviewModel.update(review.id, "user-1", {
        rating: 5,
        comment: "Actually it's excellent!",
      });

      expect(updated).not.toBeNull();
      expect(updated!.rating).toBe(5);
      expect(updated!.comment).toBe("Actually it's excellent!");
    });

    it("should return null when review does not exist", async () => {
      const result = await reviewModel.update("nonexistent", "user-1", { rating: 5 });

      expect(result).toBeNull();
    });

    it("should throw when user is not the review owner", async () => {
      const review = await reviewModel.create({
        user_id: "user-1",
        menu_item_id: "menu-1",
        rating: 4,
        comment: "Good",
      });

      await expect(
        reviewModel.update(review.id, "user-2", { rating: 5 })
      ).rejects.toThrow("Not authorized to update this review");
    });

    it("should only update provided fields", async () => {
      const review = await reviewModel.create({
        user_id: "user-1",
        menu_item_id: "menu-1",
        rating: 4,
        comment: "Good pizza",
      });

      const updated = await reviewModel.update(review.id, "user-1", { rating: 5 });

      expect(updated!.rating).toBe(5);
      expect(updated!.comment).toBe("Good pizza");
    });

    it("should update the updated_at timestamp", async () => {
      const review = await reviewModel.create({
        user_id: "user-1",
        menu_item_id: "menu-1",
        rating: 3,
        comment: "Ok",
      });

      const beforeUpdate = review.updated_at;
      await new Promise((resolve) => setTimeout(resolve, 10));

      const updated = await reviewModel.update(review.id, "user-1", { rating: 4 });

      expect(updated!.updated_at.getTime()).toBeGreaterThanOrEqual(beforeUpdate.getTime());
    });

    it("should throw on invalid rating during update", async () => {
      const review = await reviewModel.create({
        user_id: "user-1",
        menu_item_id: "menu-1",
        rating: 3,
        comment: "Ok",
      });

      await expect(
        reviewModel.update(review.id, "user-1", { rating: 10 })
      ).rejects.toThrow("Rating must be between 1 and 5");
    });

    it("should throw on empty comment during update", async () => {
      const review = await reviewModel.create({
        user_id: "user-1",
        menu_item_id: "menu-1",
        rating: 3,
        comment: "Ok",
      });

      await expect(
        reviewModel.update(review.id, "user-1", { comment: "" })
      ).rejects.toThrow("Comment cannot be empty");
    });
  });

  describe("delete", () => {
    it("should delete review when user is the owner", async () => {
      const review = await reviewModel.create({
        user_id: "user-1",
        menu_item_id: "menu-1",
        rating: 5,
        comment: "Delete me",
      });

      const result = await reviewModel.delete(review.id, "user-1");

      expect(result).toBe(true);
      const remaining = await reviewModel.findByUserId("user-1");
      expect(remaining).toHaveLength(0);
    });

    it("should delete review when user is admin", async () => {
      const review = await reviewModel.create({
        user_id: "user-1",
        menu_item_id: "menu-1",
        rating: 3,
        comment: "Admin delete",
      });

      const result = await reviewModel.delete(review.id, "admin-user", true);

      expect(result).toBe(true);
    });

    it("should return false when review does not exist", async () => {
      const result = await reviewModel.delete("nonexistent", "user-1");

      expect(result).toBe(false);
    });

    it("should throw when non-owner non-admin tries to delete", async () => {
      const review = await reviewModel.create({
        user_id: "user-1",
        menu_item_id: "menu-1",
        rating: 5,
        comment: "My review",
      });

      await expect(
        reviewModel.delete(review.id, "user-2")
      ).rejects.toThrow("Not authorized to delete this review");
    });
  });

  describe("rating validation", () => {
    it("should reject rating of 0", async () => {
      await expect(
        reviewModel.create({ user_id: "u1", menu_item_id: "m1", rating: 0, comment: "Zero" })
      ).rejects.toThrow("Rating must be between 1 and 5");
    });

    it("should reject negative ratings", async () => {
      await expect(
        reviewModel.create({ user_id: "u1", menu_item_id: "m1", rating: -1, comment: "Negative" })
      ).rejects.toThrow("Rating must be between 1 and 5");
    });

    it("should reject rating of 6", async () => {
      await expect(
        reviewModel.create({ user_id: "u1", menu_item_id: "m1", rating: 6, comment: "Six" })
      ).rejects.toThrow("Rating must be between 1 and 5");
    });

    it("should accept decimal ratings within range", async () => {
      const review = await reviewModel.create({
        user_id: "u1",
        menu_item_id: "m1",
        rating: 4.5,
        comment: "Great half rating",
      });

      expect(review.rating).toBe(4.5);
    });

    it("should accept boundary values 1 and 5", async () => {
      const review1 = await reviewModel.create({
        user_id: "u1",
        menu_item_id: "m1",
        rating: 1,
        comment: "Worst",
      });
      const review5 = await reviewModel.create({
        user_id: "u2",
        menu_item_id: "m2",
        rating: 5,
        comment: "Best",
      });

      expect(review1.rating).toBe(1);
      expect(review5.rating).toBe(5);
    });
  });
});
