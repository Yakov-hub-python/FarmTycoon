const vip = require('./vip')

function getReferralLink(userId, botUsername='FarmTycoonGameBot' ) {
    return `https://t.me/${botUsername}?start=ref_${userId}`
}

function processReferral(newUser, inviter, inviterReward = 5000, newUserReward = 1500) {
    if (newUser.id === inviter.id) return { ok: false, error: 'self_referral' }
    if (newUser.referredBy) return { ok: false, error: 'already_referred' }

    newUser.referredBy = inviter.id
    inviter.coin += inviterReward
    inviter.referralCount += 1
    if(inviter.referralCount % 3 === 0) {
        vip.addVipDays(inviter, 7)
    }
    newUser.coin += newUserReward
    return { ok: true, inviterReward, newUserReward }
}

module.exports = { getReferralLink, processReferral }