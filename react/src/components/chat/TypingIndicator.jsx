import React from 'react';

const TypingIndicator = ({ typingUsers = [] }) => {
    if (typingUsers.length === 0) {
        return null;
    }

    const names = typingUsers.map(u => `User ${u.userId}`).join(', ');
    const verb = typingUsers.length > 1 ? 'are' : 'is';

    return (
        <div className="h-8 px-6 py-2 text-sm text-gray-500 italic bg-gray-50">
            {`${names} ${verb} typing...`}
        </div>
    );
};

export default TypingIndicator;