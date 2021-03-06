const mongoose = require('mongoose');
mongoose.Promise = require('bluebird');

const TeamEventSchema = new mongoose.Schema(
    {
        eventId: { type: String, required: true },
        teamId: { type: String, required: true },
        programId: { type: String, required: true },
        registeredOn: { type: Date }, // date when team has confirmed their registration
        participatedOn: { type: Date }, // date team participated at the event - no date = team, did not arrive
        eventDate: { type: Date },
        teamNumber: { type: String },
        confirmed: { type: Date },
    },
    {
        usePushEach: true,
    }
);

// unique index to ensure team can register for specific event only once
TeamEventSchema.index({ eventId: 1, teamId: 1 }, { unique: true });

if (!mongoose.models.TeamEvent) {
    mongoose.model('TeamEvent', TeamEventSchema);
}

module.exports = TeamEventSchema;
