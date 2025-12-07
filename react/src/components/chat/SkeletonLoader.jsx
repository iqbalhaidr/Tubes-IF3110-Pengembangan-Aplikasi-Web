import React from 'react';

const SkeletonLoader = ({ className = 'h-4 bg-gray-200 rounded' }) => {
    return (
        <div className="animate-pulse">
            <div className={className}></div>
        </div>
    );
};

export const ChatListSkeleton = () => {
    return (
        <div className="p-4">
            {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center mb-4 p-4">
                    <SkeletonLoader className="h-12 w-12 rounded-full mr-4 bg-gray-200" />
                    <div className="flex-1">
                        <SkeletonLoader className="h-5 w-3/4 mb-2 bg-gray-200 rounded" />
                        <SkeletonLoader className="h-4 w-1/2 bg-gray-200 rounded" />
                    </div>
                </div>
            ))}
        </div>
    );
};

export const MessageListSkeleton = () => {
    return (
        <div className="p-4 space-y-4">
            <div className="flex justify-end">
                <SkeletonLoader className="h-12 w-2/5 rounded-2xl bg-gray-200" />
            </div>
            <div className="flex justify-start">
                <SkeletonLoader className="h-20 w-3/5 rounded-2xl bg-gray-200" />
            </div>
            <div className="flex justify-end">
                <SkeletonLoader className="h-10 w-1/3 rounded-2xl bg-gray-200" />
            </div>
            <div className="flex justify-start">
                <SkeletonLoader className="h-16 w-2/5 rounded-2xl bg-gray-200" />
            </div>
        </div>
    );
}


export default SkeletonLoader;