import React from "react";

export function BookCardSkeleton() {
  return (
    <div className="for-you__recommended--books-link skeleton">
      <div className="skeleton__image"></div>
      <div className="skeleton__title"></div>
      <div className="skeleton__author"></div>
      <div className="skeleton__subtitle"></div>
      <div className="skeleton__footer">
        <div className="skeleton__duration"></div>
        <div className="skeleton__rating"></div>
      </div>
    </div>
  );
}

export function BookDetailSkeleton() {
  return (
    <div className="book-detail-skeleton">
      <div className="skeleton__detail-image"></div>
      <div className="skeleton__detail-content">
        <div className="skeleton__detail-title"></div>
        <div className="skeleton__detail-author"></div>
        <div className="skeleton__detail-subtitle"></div>
        <div className="skeleton__detail-tags">
          <div className="skeleton__tag"></div>
          <div className="skeleton__tag"></div>
          <div className="skeleton__tag"></div>
        </div>
        <div className="skeleton__detail-description"></div>
        <div className="skeleton__detail-description"></div>
        <div className="skeleton__detail-description"></div>
      </div>
    </div>
  );
}

export function BookRowSkeleton() {
  return (
    <>
      <BookCardSkeleton />
      <BookCardSkeleton />
      <BookCardSkeleton />
      <BookCardSkeleton />
      <BookCardSkeleton />
    </>
  );
}
